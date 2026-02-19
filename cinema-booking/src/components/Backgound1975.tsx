"use client";

export default function Background1975() {
  return (
    <div className="bg-1975" aria-hidden>
      {/* Floating bokeh dots */}
      <div className="bokeh-layer">
        {/* You can add/remove dots or tweak positions below */}
        <div className="bokeh-dot dot-lg" style={{ top: "8%",   left: "12%"  }} />
        <div className="bokeh-dot"       style={{ top: "22%",  left: "72%"  }} />
        <div className="bokeh-dot dot-sm" style={{ top: "40%",  left: "18%"  }} />
        <div className="bokeh-dot dot-lg" style={{ top: "62%",  left: "58%"  }} />
        <div className="bokeh-dot"        style={{ top: "78%",  left: "28%"  }} />
        <div className="bokeh-dot dot-sm" style={{ top: "16%",  left: "86%"  }} />
      </div>

      {/* Soft spotlight cones */}
      <div className="spotlight-layer">
        <div className="spotlight" />
        <div className="spotlight alt" />
      </div>

      {/* Edge vignette to focus center */}
      <div className="vignette-1975" />
    </div>
  );
}