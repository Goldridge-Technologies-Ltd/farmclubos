import Image from "next/image";
import type { EcosystemNode } from "@/content/pages/home";
import { Icon } from "@/components/ui/Icon";

type EcosystemDiagramProps = {
  core: { title: string; suffix: string };
  nodes: EcosystemNode[];
};

/*
  Six capabilities orbiting the FARMCLUB OS core.

  On large screens the nodes sit on a dashed ring with their labels in matching
  left and right columns. Below `lg` the ring is replaced by a plain two-column
  list, which stays legible on a phone without shrinking the artwork.

  Node order follows the content array and maps onto the ring clockwise from the
  upper-left position used in the reference artwork.
*/
const RING_ANGLES = [240, 300, 0, 60, 120, 180];
const ORBIT_RADIUS = 40; // % of the square, so discs sit on the dashed ring
const DOT_ANGLES = [30, 90, 150, 210, 270, 330];

function polar(angleDeg: number, radius: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    left: `${50 + radius * Math.cos(rad)}%`,
    top: `${50 + radius * Math.sin(rad)}%`,
  };
}

export function EcosystemDiagram({ core, nodes }: EcosystemDiagramProps) {
  const leftLabels = [nodes[0], nodes[5], nodes[4]].filter(Boolean); // Learn, Finance, Market
  const rightLabels = [nodes[1], nodes[2], nodes[3]].filter(Boolean); // Innovate, Enterprise, Connect

  return (
    <div>
      {/*
        Both renderings below are viewport-specific, so the accessible copy is
        provided once here and does not depend on which one is on screen.
      */}
      <ul className="sr-only">
        {nodes.map((node) => (
          <li key={node.label}>
            {node.label}: {node.description}
          </li>
        ))}
      </ul>

      {/* Compact layout for small screens */}
      <ul aria-hidden="true" className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2 lg:hidden">
        {nodes.map((node) => (
          <li key={node.label} className="flex gap-3.5">
            <span
              className={[
                "inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white",
                node.tone === "gold" ? "bg-farm-gold-600" : "bg-farm-green-700",
              ].join(" ")}
            >
              <Icon name={node.icon} size={22} />
            </span>
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.1em] text-farm-green-950">
                {node.label}
              </p>
              <p className="mt-1 text-sm leading-6 text-farm-muted">
                {node.description}
              </p>
            </div>
          </li>
        ))}
      </ul>

      {/* Ring layout */}
      <div
        aria-hidden="true"
        className="hidden lg:grid lg:grid-cols-[minmax(6.5rem,0.5fr)_minmax(24rem,1fr)_minmax(6.5rem,0.5fr)] lg:items-center lg:gap-1"
      >
        <div className="grid gap-16 text-right">
          {leftLabels.map((node) => (
            <NodeLabel key={node.label} node={node} align="right" />
          ))}
        </div>

        <div className="relative aspect-square">
          {/* dashed orbit */}
          <span
            className="absolute rounded-full border border-dashed border-farm-green-700/35"
            style={{
              inset: `${50 - ORBIT_RADIUS}%`,
            }}
          />
          {DOT_ANGLES.map((angle) => (
            <span
              key={angle}
              className="absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-farm-green-900"
              style={polar(angle, ORBIT_RADIUS)}
            />
          ))}

          {/* core */}
          <div className="absolute left-1/2 top-1/2 flex h-[42%] w-[42%] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full bg-farm-green-950 text-center">
            <Image
              src="/brand/symbol-mark-white.svg"
              alt=""
              width={110}
              height={110}
              className="h-14 w-auto"
            />
            <p className="mt-2.5 text-xl leading-tight font-semibold tracking-wide text-white">
              {core.title}
            </p>
            <p className="text-xl leading-tight font-semibold tracking-wide text-farm-gold-500">
              {core.suffix}
            </p>
          </div>

          {/* nodes */}
          {nodes.map((node, index) => (
            <span
              key={node.label}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-white p-2 shadow-[0_8px_26px_rgb(5_42_25_/_10%)]"
              style={polar(RING_ANGLES[index], ORBIT_RADIUS)}
            >
              <span
                className={[
                  "flex h-[4.25rem] w-[4.25rem] items-center justify-center rounded-full text-white",
                  node.tone === "gold"
                    ? "bg-farm-gold-600"
                    : "bg-farm-green-700",
                ].join(" ")}
              >
                <Icon name={node.icon} size={30} />
              </span>
            </span>
          ))}
        </div>

        <div className="grid gap-16 text-left">
          {rightLabels.map((node) => (
            <NodeLabel key={node.label} node={node} align="left" />
          ))}
        </div>
      </div>
    </div>
  );
}

function NodeLabel({
  node,
  align,
}: {
  node: EcosystemNode;
  align: "left" | "right";
}) {
  return (
    <div className={align === "right" ? "justify-self-end" : "justify-self-start"}>
      <p className="text-[0.9rem] font-bold uppercase tracking-[0.08em] text-farm-green-950">
        {node.label}
      </p>
      <p className="mt-1.5 max-w-[11rem] text-[0.8rem] leading-5 text-farm-muted">
        {node.description}
      </p>
    </div>
  );
}
