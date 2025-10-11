import React, { useRef, useEffect, useState } from 'react';

interface AnimatedOrderButtonProps {
  isLoading?: boolean;
  isSuccess?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  children?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export function AnimatedOrderButton({
  isLoading = false,
  isSuccess = false,
  onClick,
  children = 'تأكيد الشراء',
  disabled = false,
  className = '',
}: AnimatedOrderButtonProps) {
  const [animate, setAnimate] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isSuccess) {
      setAnimate(true);
      timeoutRef.current = setTimeout(() => setAnimate(false), 10000);
    } else if (!isLoading) {
      setAnimate(false);
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isSuccess, isLoading]);

  return (
    <button
      type="submit"
      className={`order${animate ? ' animate' : ''} ${className}`}
      onClick={onClick}
      disabled={isLoading || disabled}
      aria-busy={isLoading}
      aria-live="polite"
      style={{ width: 240, height: 63, position: 'relative', borderRadius: 32 }}
    >
      <span className={`default${animate ? '' : ''}`}>{children}</span>
      <span className="success">
        تم الطلب
        <svg viewBox="0 0 12 10">
          <polyline points="1.5 6 4.5 9 10.5 1"></polyline>
        </svg>
      </span>
      <div className="box"></div>
      <div className="truck">
        <div className="back"></div>
        <div className="front">
          <div className="window"></div>
        </div>
        <div className="light top"></div>
        <div className="light bottom"></div>
      </div>
      <div className="lines"></div>
      <style jsx>{`
        :global(.order) {
          appearance: none;
          border: 0;
          background: #1D4ED8;
          position: relative;
          height: 63px;
          width: 240px;
          padding: 0;
          outline: none;
          cursor: pointer;
          border-radius: 32px;
          overflow: hidden;
          transition: transform 0.3s ease;
          box-shadow: 0 2px 12px 0 rgba(34,51,107,0.10);
        }
        :global(.order span) {
          --o: 1;
          position: absolute;
          left: 0;
          right: 0;
          text-align: center;
          top: 19px;
          line-height: 24px;
          color: #FFF;
          font-size: 16px;
          font-weight: 500;
          opacity: var(--o);
          transition: opacity 0.3s ease;
        }
        :global(.order span.default) {
          transition-delay: 0.3s;
        }
        :global(.order span.success) {
          --offset: 16px;
          --o: 0;
        }
        :global(.order span.success svg) {
          width: 12px;
          height: 10px;
          display: inline-block;
          vertical-align: top;
          fill: none;
          margin: 7px 0 0 4px;
          stroke: #16BF78;
          stroke-width: 2;
          stroke-linecap: round;
          stroke-linejoin: round;
          stroke-dasharray: 16px;
          stroke-dashoffset: var(--offset);
          transition: stroke-dashoffset 0.3s ease;
        }
        :global(.order:active) {
          transform: scale(0.96);
        }
        :global(.order .lines) {
          opacity: 0;
          position: absolute;
          height: 3px;
          background: #FFF;
          border-radius: 2px;
          width: 6px;
          top: 30px;
          left: 100%;
          box-shadow: 15px 0 0 #FFF, 30px 0 0 #FFF, 45px 0 0 #FFF, 60px 0 0 #FFF, 75px 0 0 #FFF, 90px 0 0 #FFF, 105px 0 0 #FFF, 120px 0 0 #FFF, 135px 0 0 #FFF, 150px 0 0 #FFF, 165px 0 0 #FFF, 180px 0 0 #FFF, 195px 0 0 #FFF, 210px 0 0 #FFF, 225px 0 0 #FFF, 240px 0 0 #FFF, 255px 0 0 #FFF, 270px 0 0 #FFF, 285px 0 0 #FFF, 300px 0 0 #FFF, 315px 0 0 #FFF, 330px 0 0 #FFF;
        }
        :global(.order .back), :global(.order .box) {
          border-radius: 2px;
          background: linear-gradient(#e0e7ff, #a5b4fc);
          position: absolute;
        }
        :global(.order .truck) {
          width: 60px;
          height: 41px;
          left: 100%;
          z-index: 1;
          top: 11px;
          position: absolute;
          transform: translateX(24px);
        }
        :global(.order .truck:before), :global(.order .truck:after) {
          content: "";
          height: 2px;
          width: 20px;
          right: 58px;
          position: absolute;
          display: block;
          background: #e0e7ff;
          border-radius: 1px;
          transform-origin: 100% 50%;
          transform: rotate(-90deg);
        }
        :global(.order .truck:after) {
          transform: rotate(90deg);
          bottom: 4px;
        }
        :global(.order .truck .back) {
          left: 0;
          top: 0;
          width: 60px;
          height: 41px;
          z-index: 1;
        }
        :global(.order .truck .front) {
          overflow: hidden;
          position: absolute;
          border-radius: 2px 9px 9px 2px;
          width: 26px;
          height: 41px;
          left: 60px;
        }
        :global(.order .truck .front:before) {
          content: "";
          height: 13px;
          width: 2px;
          left: 0;
          top: 14px;
          background: linear-gradient(#64748b, #1D4ED8);
          position: absolute;
        }
        :global(.order .truck .front:after) {
          content: "";
          border-radius: 2px 9px 9px 2px;
          background: #1D4ED8;
          width: 24px;
          height: 41px;
          right: 0;
          position: absolute;
        }
        :global(.order .truck .front .window) {
          overflow: hidden;
          border-radius: 2px 8px 8px 2px;
          background: #3b82f6;
          transform: perspective(4px) rotateY(3deg);
          width: 22px;
          height: 41px;
          position: absolute;
          left: 2px;
          top: 0;
          z-index: 1;
          transform-origin: 0 50%;
        }
        :global(.order .truck .front .window:before) {
          content: "";
          position: absolute;
          right: 0;
          top: 0;
          bottom: 0;
          width: 14px;
          background: #1D4ED8;
        }
        :global(.order .truck .front .window:after) {
          content: "";
          width: 14px;
          top: 7px;
          height: 4px;
          position: absolute;
          right: 0;
          background: rgba(255,255,255,0.14);
          transform: skewY(14deg);
          box-shadow: 0 7px 0 rgba(255,255,255,0.14);
        }
        :global(.order .truck .light) {
          width: 3px;
          height: 8px;
          left: 83px;
          transform-origin: 100% 50%;
          position: absolute;
          border-radius: 2px;
          transform: scaleX(0.8);
          background: #f0dc5f;
        }
        :global(.order .truck .light.top) {
          top: 4px;
        }
        :global(.order .truck .light.bottom) {
          bottom: 4px;
        }
        :global(.order .box) {
          width: 21px;
          height: 21px;
          right: 100%;
          top: 21px;
        }
        :global(.order .box:before) {
          content: "";
          top: 10px;
          position: absolute;
          left: 0;
          right: 0;
          height: 3px;
          margin-top: -1px;
          background: rgba(0,0,0,0.1);
        }
        :global(.order .box:after) {
          content: "";
          top: 10px;
          position: absolute;
          left: 0;
          right: 0;
          height: 1px;
          background: rgba(0,0,0,0.15);
        }
        :global(.order.animate .default) {
          --o: 0;
          transition-delay: 0s;
        }
        :global(.order.animate .success) {
          --offset: 0;
          --o: 1;
          transition-delay: 7s;
        }
        :global(.order.animate .success svg) {
          transition-delay: 7.3s;
        }
        :global(.order.animate .truck) {
          animation: truck 10s ease forwards;
        }
        :global(.order.animate .truck:before) {
          animation: door1 2.4s ease forwards 0.3s;
        }
        :global(.order.animate .truck:after) {
          animation: door2 2.4s ease forwards 0.6s;
        }
        :global(.order.animate .truck .light:before), :global(.order.animate .truck .light:after) {
          animation: light 10s ease forwards;
        }
        :global(.order.animate .box) {
          animation: box 10s ease forwards;
        }
        :global(.order.animate .lines) {
          animation: lines 10s ease forwards;
        }
        @keyframes truck {
          10%, 30% { transform: translateX(-164px); }
          40% { transform: translateX(-104px); }
          60% { transform: translateX(-224px); }
          75%, 100% { transform: translateX(24px); }
        }
        @keyframes lines {
          0%, 30% { opacity: 0; transform: scaleY(0.7) translateX(0); }
          35%, 65% { opacity: 1; }
          70% { opacity: 0; }
          100% { transform: scaleY(0.7) translateX(-400px); }
        }
        @keyframes light {
          0%, 30% { opacity: 0; transform: perspective(2px) rotateY(-15deg) scaleX(0.88); }
          40%, 100% { opacity: 1; transform: perspective(2px) rotateY(-15deg) scaleX(0.94); }
        }
        @keyframes door1 {
          30%, 50% { transform: rotate(32deg); }
        }
        @keyframes door2 {
          30%, 50% { transform: rotate(-32deg); }
        }
        @keyframes box {
          8%, 10% { transform: translateX(40px); opacity: 1; }
          25% { transform: translateX(112px); opacity: 1; }
          26% { transform: translateX(112px); opacity: 0; }
          27%, 100% { transform: translateX(0px); opacity: 0; }
        }
      `}</style>
    </button>
  );
} 