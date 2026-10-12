"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, type RefObject } from "react";
import { PerspectiveCamera, type Mesh } from "three";
import { fovForAspect } from "@/core/camera";
import { CHAPTERS, planTransition, sampleTransition, type ChapterId, type Pose, type Transition } from "@/core/journey";
import { damp } from "@/core/math";
import { useWorldStore, type EmphasisState } from "@/state/store";
import { rollBall } from "../ballRoll";
import { LANDMARKS } from "../landmarks";
import { BALL } from "../layout";
import { BALL_START, ESTABLISHING_POSE, STATIONS, type JourneyStation } from "./stations";

const chapterBefore = (chapter: ChapterId): ChapterId | null => {
  const index = CHAPTERS.findIndex((c) => c.id === chapter);
  return index > 0 ? CHAPTERS[index - 1].id : null;
};

/** How quickly the ball rolls to its next resting spot. */
const BALL_LAMBDA = 1.6;

interface Props {
  ball: RefObject<Mesh | null>;
  /** Start from the live camera and ball (returning from free play) instead of the establishing shot. */
  resume: boolean;
}

/**
 * Highlight exactly one landmark (or none) through the shared emphasis state.
 * With `dimBoards`, the other project boards drop below their ambient level.
 */
function publishHighlight(id: string | null, dimBoards = false) {
  const states: Record<string, EmphasisState> = {};
  for (const landmark of LANDMARKS) {
    states[landmark.id] = landmark.id === id ? "active" : dimBoards && landmark.kind === "board" ? "dim" : "idle";
  }
  useWorldStore.getState().setDiscovery(id, states);
}

/** Fraction of a move after which the arriving station's final scoreboard and highlight apply. */
const ARRIVAL_SWAP = 0.7;

const poseOf = (camera: { position: { x: number; y: number; z: number } }, target: Pose["tx"][]): Pose => ({
  px: camera.position.x,
  py: camera.position.y,
  pz: camera.position.z,
  tx: target[0],
  ty: target[1],
  tz: target[2],
});

/**
 * Journey camera and ball (owner spec §5, §7). One shared state, the active
 * station, drives the camera move, the ball, the scoreboard and the
 * highlighted object. The camera moves only between stations and rests while
 * the visitor reads; a new station mid-move redirects from the current pose.
 */
export function JourneyCamera({ ball, resume }: Props) {
  const get = useThree((s) => s.get);
  const invalidate = useThree((s) => s.invalidate);
  const size = useThree((s) => s.size);
  const station = useWorldStore((s) => s.journeyStation);
  const jump = useWorldStore((s) => s.journeyJump);

  const pose = useRef<Pose>(ESTABLISHING_POSE);
  const transition = useRef<Transition | null>(null);
  const elapsed = useRef(0);
  const fromChapter = useRef<ChapterId | null>(null);
  const fromStation = useRef<JourneyStation | null>(null);
  const pendingFrom = useRef<JourneyStation | null>(null);
  const ballPosition = useRef({ ...BALL_START });
  const ballTarget = useRef({ ...BALL_START });
  const started = useRef(false);
  /** Station whose final scoreboard/highlight replace its `arriving` state near the end of the move. */
  const pendingArrival = useRef<JourneyStation | null>(null);
  const pendingReplay = useRef(false);

  // Returning from free play: continue from wherever the camera and ball are.
  useEffect(() => {
    if (!resume) return;
    const { camera } = get();
    const target = camera.getWorldDirection(camera.position.clone()).multiplyScalar(20).add(camera.position);
    pose.current = poseOf(camera, [target.x, target.y, target.z]);
    if (ball.current) ballPosition.current = { x: ball.current.position.x, z: ball.current.position.z };
    started.current = true;
  }, [resume, get, ball]);

  // Replay starts from the current pose with a slower, deliberate move home.
  useEffect(() => {
    if (jump?.replay) pendingReplay.current = true;
  }, [jump]);

  // Portrait screens get a wider vertical FOV so the stadium still fits.
  useEffect(() => {
    const camera = get().camera;
    if (!(camera instanceof PerspectiveCamera)) return;
    camera.fov = fovForAspect(size.width / Math.max(1, size.height));
    camera.updateProjectionMatrix();
    invalidate();
  }, [get, size, invalidate]);

  const portrait = size.width / Math.max(1, size.height) < 0.8;

  // Station change → plan the move and update the stadium (scoreboard, highlight).
  useEffect(() => {
    const station_ = STATIONS[station];
    if (!station_) return;
    // Portrait screens use the station's portrait framing when it has one.
    const target = portrait && station_.portrait ? { ...station_, pose: station_.portrait } : station_;
    const { reducedMotion, setScoreboard, setPanelDelay } = useWorldStore.getState();
    const moving = transition.current !== null && elapsed.current < transition.current.duration;
    const fromChapterBefore = fromChapter.current;
    const kind = !started.current ? "intro" : pendingReplay.current ? "replay" : "move";
    const plan = planTransition(pose.current, fromChapter.current, target, {
      interrupted: moving,
      reducedMotion,
      kind,
      from: fromStation.current,
    });

    transition.current = plan;
    elapsed.current = 0;
    // Where the camera "is" changes only once it has mostly arrived (see useFrame), so a move
    // redirected early still plans from the place it left, e.g. back through the tunnel mouth.
    pendingFrom.current = station_;
    started.current = true;
    pendingReplay.current = false;
    ballTarget.current = { ...target.ball };

    // Arriving from the previous chapter: bridge with the station's `arriving` state first.
    const bridging =
      target.arriving && kind === "move" && fromChapterBefore !== null && chapterBefore(target.chapter) === fromChapterBefore;
    const shown = bridging ? target.arriving! : target;
    setScoreboard(shown.scoreboard);
    useWorldStore.getState().setStadiumMood(station_.chapter === "fulltime" ? "closing" : "match");
    publishHighlight(shown.highlight, !bridging && target.dimBoards);
    pendingArrival.current = bridging ? target : null;
    // Content appears as the camera is arriving, not after it stops (spec §5).
    setPanelDelay(kind === "intro" ? 0.35 : plan.duration * 0.55);
    useWorldStore.setState({ moveDuration: plan.duration });
    invalidate();
  }, [station, portrait, invalidate]);

  useFrame(({ camera }, delta) => {
    const dt = Math.min(delta, 0.05);
    const { reducedMotion } = useWorldStore.getState();
    let busy = false;

    const plan = transition.current;
    if (plan && pendingFrom.current && elapsed.current >= plan.duration * ARRIVAL_SWAP) {
      fromStation.current = pendingFrom.current;
      fromChapter.current = pendingFrom.current.chapter;
      pendingFrom.current = null;
    }
    if (plan && pendingArrival.current && elapsed.current >= plan.duration * ARRIVAL_SWAP) {
      const arrived = pendingArrival.current;
      pendingArrival.current = null;
      useWorldStore.getState().setScoreboard(arrived.scoreboard);
      publishHighlight(arrived.highlight, arrived.dimBoards);
    }
    if (plan) {
      elapsed.current += dt;
      pose.current = sampleTransition(plan, elapsed.current);
      if (elapsed.current >= plan.duration) transition.current = null;
      else busy = true;
    }
    const p = pose.current;
    camera.position.set(p.px, p.py, p.pz);
    camera.lookAt(p.tx, p.ty, p.tz);

    const mesh = ball.current;
    if (mesh) {
      const current = ballPosition.current;
      const goal = ballTarget.current;
      const x = reducedMotion ? goal.x : damp(current.x, goal.x, BALL_LAMBDA, dt);
      const z = reducedMotion ? goal.z : damp(current.z, goal.z, BALL_LAMBDA, dt);
      rollBall(mesh, x - current.x, z - current.z);
      mesh.position.set(x, BALL.radius, z);
      current.x = x;
      current.z = z;
      if (Math.hypot(goal.x - x, goal.z - z) > 0.005) busy = true;
    }

    if (busy) invalidate();
  });

  return null;
}
