"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import type { Engine, World, Body, Events } from "matter-js";
import { SUIKA_LEVELS } from "@/constants/games";

export interface FruitBody {
  body: Body;
  level: number;
  id: number;
  droppedAt: number;
}

const WALL_THICKNESS = 30;
const DROP_LINE_Y = 80;

let idCounter = 0;

export function useSuikaGame(canvasWidth: number, canvasHeight: number) {
  const engineRef = useRef<Engine | null>(null);
  const fruitsRef = useRef<FruitBody[]>([]);
  const pendingMerges = useRef<Set<number>>(new Set());
  const animFrameRef = useRef<number>(0);

  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [nextLevel, setNextLevel] = useState(() => Math.floor(Math.random() * 5));
  const [initialized, setInitialized] = useState(false);

  const initEngine = useCallback(async () => {
    const Matter = await import("matter-js");
    const { Engine, World, Bodies, Events } = Matter;

    const engine = Engine.create({ gravity: { y: 1.5 } });
    engineRef.current = engine;

    // 벽 생성
    const ground = Bodies.rectangle(
      canvasWidth / 2, canvasHeight + WALL_THICKNESS / 2,
      canvasWidth, WALL_THICKNESS, { isStatic: true, label: "wall" }
    );
    const leftWall = Bodies.rectangle(
      -WALL_THICKNESS / 2, canvasHeight / 2,
      WALL_THICKNESS, canvasHeight * 2, { isStatic: true, label: "wall" }
    );
    const rightWall = Bodies.rectangle(
      canvasWidth + WALL_THICKNESS / 2, canvasHeight / 2,
      WALL_THICKNESS, canvasHeight * 2, { isStatic: true, label: "wall" }
    );

    World.add(engine.world, [ground, leftWall, rightWall]);

    // 충돌 이벤트
    Events.on(engine, "collisionStart", (event) => {
      event.pairs.forEach(({ bodyA, bodyB }) => {
        if (bodyA.label === "wall" || bodyB.label === "wall") return;
        const fruitA = fruitsRef.current.find((f) => f.body.id === bodyA.id);
        const fruitB = fruitsRef.current.find((f) => f.body.id === bodyB.id);
        if (!fruitA || !fruitB) return;
        if (fruitA.level !== fruitB.level) return;
        if (pendingMerges.current.has(fruitA.body.id) || pendingMerges.current.has(fruitB.body.id)) return;

        pendingMerges.current.add(fruitA.body.id);
        pendingMerges.current.add(fruitB.body.id);

        const level = fruitA.level;
        const mx = (bodyA.position.x + bodyB.position.x) / 2;
        const my = (bodyA.position.y + bodyB.position.y) / 2;

        setTimeout(() => {
          const { Bodies, World: W } = require("matter-js");
          const engine_ = engineRef.current;
          if (!engine_) return;

          // 제거
          fruitsRef.current = fruitsRef.current.filter(
            (f) => f.body.id !== fruitA.body.id && f.body.id !== fruitB.body.id
          );
          W.remove(engine_.world, [fruitA.body, fruitB.body]);
          pendingMerges.current.delete(fruitA.body.id);
          pendingMerges.current.delete(fruitB.body.id);

          // 다음 레벨 추가 (최대 레벨은 병합 없음)
          if (level < SUIKA_LEVELS.length - 1) {
            const newLevel = level + 1;
            const r = SUIKA_LEVELS[newLevel].size / 2;
            const newBody = Bodies.circle(mx, my, r, {
              restitution: 0.3,
              friction: 0.5,
              label: `fruit_${++idCounter}`,
            });
            W.add(engine_.world, newBody);
            fruitsRef.current.push({ body: newBody, level: newLevel, id: idCounter, droppedAt: Date.now() });
          }

          setScore((s) => s + SUIKA_LEVELS[level].score * 2);
        }, 0);
      });
    });

    setInitialized(true);
  }, [canvasWidth, canvasHeight]);

  const dropFruit = useCallback(
    async (x: number) => {
      if (gameOver || !engineRef.current) return;
      const Matter = await import("matter-js");
      const { Bodies, World } = Matter;

      const level = nextLevel;
      const r = SUIKA_LEVELS[level].size / 2;
      const clampedX = Math.max(r + WALL_THICKNESS, Math.min(canvasWidth - r - WALL_THICKNESS, x));

      const body = Bodies.circle(clampedX, DROP_LINE_Y, r, {
        restitution: 0.3,
        friction: 0.5,
        label: `fruit_${++idCounter}`,
      });
      World.add(engineRef.current.world, body);
      fruitsRef.current.push({ body, level, id: idCounter, droppedAt: Date.now() });
      setNextLevel(Math.floor(Math.random() * 5));
    },
    [gameOver, nextLevel, canvasWidth]
  );

  const step = useCallback(async () => {
    if (!engineRef.current) return;
    const Matter = await import("matter-js");
    Matter.Engine.update(engineRef.current, 1000 / 60);

    // 게임 오버 감지: 드롭 후 1초 이상 지난 과일이 drop 라인 위에 정지해 있으면
    const now = Date.now();
    const over = fruitsRef.current.some(
      (f) =>
        now - f.droppedAt > 1000 &&
        f.body.position.y - SUIKA_LEVELS[f.level].size / 2 < DROP_LINE_Y &&
        f.body.speed < 0.5
    );
    if (over) setGameOver(true);

    animFrameRef.current = requestAnimationFrame(step);
  }, []);

  const reset = useCallback(async () => {
    if (!engineRef.current) return;
    const Matter = await import("matter-js");
    const { World, Composite } = Matter;

    // 과일만 제거 (벽은 유지)
    fruitsRef.current.forEach((f) => {
      World.remove(engineRef.current!.world, f.body);
    });
    fruitsRef.current = [];
    pendingMerges.current.clear();
    setScore(0);
    setGameOver(false);
    setNextLevel(Math.floor(Math.random() * 5));
  }, []);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  return {
    engineRef,
    fruitsRef,
    score,
    gameOver,
    nextLevel,
    initialized,
    initEngine,
    dropFruit,
    step,
    reset,
    DROP_LINE_Y,
    WALL_THICKNESS,
  };
}
