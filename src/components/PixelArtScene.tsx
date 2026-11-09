import React, { useEffect, useRef, useMemo } from 'react';
import type { SceneContext, SceneModel } from '../types/pixelArt';
import { renderPixelScene, contextToSceneModel } from '../engine/pixelArt/renderer';
import { PX } from '../engine/pixelArt/palette';

export interface PixelArtSceneProps {
  context?: SceneContext;
  model?: SceneModel;
  theme?: 'light' | 'dark';
  caption?: string;
  className?: string;
  onClick?: () => void;
  showBadge?: boolean;
}

export const PixelArtScene: React.FC<PixelArtSceneProps> = ({
  context,
  model,
  theme = 'dark',
  caption,
  className = '',
  onClick,
  showBadge = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Normalize input to SceneModel for deterministic memo key
  const effectiveModel = useMemo(() => {
    if (model) return model;
    if (context) return contextToSceneModel(context);
    return contextToSceneModel({
      age: 25,
      sex: 'M',
      countryId: 'USA',
      wealthQuintile: 3,
    });
  }, [model, context]);

  // Serialized state key for precise memoization
  const renderKey = useMemo(() => {
    const peopleHash = (effectiveModel.people || [])
      .map((p) => `${p.role}${p.sex}${p.age}${p.aid || ''}${p.sk != null ? p.sk : ''}`)
      .join(',');
    return [
      effectiveModel.stage,
      effectiveModel.mood,
      effectiveModel.urban ? 1 : 0,
      effectiveModel.region,
      effectiveModel.home,
      effectiveModel.prop,
      effectiveModel.car ? 1 : 0,
      effectiveModel.moto ? 1 : 0,
      effectiveModel.war ? 1 : 0,
      effectiveModel.act || '',
      effectiveModel.rel || '',
      effectiveModel.sk != null ? effectiveModel.sk : '',
      peopleHash,
      effectiveModel.pet || '',
      effectiveModel.pet2 || '',
      theme,
    ].join('|');
  }, [effectiveModel, theme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = PX.W;
    canvas.height = PX.H;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    renderPixelScene(ctx, effectiveModel, theme);
  }, [effectiveModel, theme, renderKey]);

  return (
    <div
      data-testid="pixel-art-scene-container"
      className={`relative overflow-hidden rounded-2xl border-3 border-black bg-[#0D1114] shadow-neo ${className}`}
    >
      <canvas
        ref={canvasRef}
        data-testid="pixel-art-canvas"
        onClick={onClick}
        width={PX.W}
        height={PX.H}
        className="w-full h-auto block select-none cursor-pointer"
        style={{
          imageRendering: 'pixelated',
          aspectRatio: `${PX.W} / ${PX.H}`,
        }}
        role="img"
        aria-label={caption || 'Procedural 192x60 Pixel Art Scene'}
      />

      {(caption || showBadge) && (
        <div className="px-3 py-1.5 bg-[#0D1114]/95 backdrop-blur-sm border-t-2 border-black flex items-center justify-between text-xs font-mono text-gray-200">
          <span className="truncate pr-2 font-bold text-gray-300">
            {caption || `${effectiveModel.home.toUpperCase()} · ${effectiveModel.stage === 'm' ? 'Утро' : effectiveModel.stage === 'd' ? 'День' : 'Вечер'}`}
          </span>
          {showBadge && (
            <span
              data-testid="pixel-art-badge"
              className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded border border-black bg-neon-cyan text-black shadow-neo-sm shrink-0 tracking-wider"
            >
              192×60 PIXEL
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default PixelArtScene;
