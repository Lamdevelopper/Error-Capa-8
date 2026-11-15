import {
  Circle,
  Triangle,
  Square,
  Umbrella,
  MoonStars,
  Heartbeat,
  Barbell,
  ArrowUpRight,
  CheckCircle,
  WarningCircle,
  DotsThree,
} from "@phosphor-icons/react";
import type { Crew, Shape, Category } from "./data";
import { crewStatus, statusText } from "./data";
import type { CategoryId, Status } from "./model";

const shapes = {
  triangle: Triangle,
  circle: Circle,
  square: Square,
  umbrella: Umbrella,
};
export function CrewShape({
  shape,
  color,
  size = 120,
}: {
  shape: Shape;
  color: string;
  size?: number;
}) {
  const Icon = shapes[shape];
  return (
    <Icon
      size={size}
      weight="fill"
      color={color}
      aria-hidden
      className={`crew-shape shape-${shape}`}
    />
  );
}
export function CategoryIcon({
  id,
  size = 23,
}: {
  id: CategoryId;
  size?: number;
}) {
  const Icon =
    id === "recovery" ? MoonStars : id === "vitals" ? Heartbeat : Barbell;
  return <Icon size={size} weight="regular" aria-hidden />;
}
export function StatusMark({ status }: { status: Status }) {
  const Icon =
    status === "nominal"
      ? CheckCircle
      : status === "unknown"
        ? DotsThree
        : WarningCircle;
  return <Icon size={15} weight="fill" aria-hidden />;
}
export function StatusPill({ status }: { status: Status }) {
  return (
    <span className={`status-pill ${status}`}>
      <StatusMark status={status} />
      {statusText[status]}
    </span>
  );
}
export function CategoryButton({
  category,
  onClick,
}: {
  category: Category;
  onClick: () => void;
}) {
  return (
    <button
      className={`category-button ${category.status}`}
      onClick={onClick}
      aria-label={`${category.name}: ${statusText[category.status]}`}
    >
      <CategoryIcon id={category.id} />
      <span>{category.short}</span>
      <span className="category-state">
        <StatusMark status={category.status} />
        {statusText[category.status]}
      </span>
    </button>
  );
}
export function CrewCard({
  person,
  index,
  onOpen,
}: {
  person: Crew;
  index: number;
  onOpen: (id: string, category?: CategoryId) => void;
}) {
  return (
    <article
      className={`crew-card ${crewStatus(person)}`}
      style={{ "--crew-color": person.color } as React.CSSProperties}
    >
      <div className="card-heading">
        <span className="eyebrow">CREW / 0{index + 1}</span>
        <StatusPill status={crewStatus(person)} />
      </div>
      <button
        className="person-button"
        onClick={() => onOpen(person.id)}
        aria-label={`Open ${person.name}`}
      >
        <div className="shape-stage">
          <CrewShape shape={person.shape} color={person.color} size={138} />
        </div>
        <div className="person-copy">
          <h2>{person.name}</h2>
          <span className="person-role">{person.role}</span>
          <p>{person.headline}</p>
        </div>
        <span className="open-person">
          <ArrowUpRight size={20} aria-hidden />
        </span>
      </button>
      <div className="category-row">
        {person.categories.map((category) => (
          <CategoryButton
            key={category.id}
            category={category}
            onClick={() => onOpen(person.id, category.id)}
          />
        ))}
      </div>
    </article>
  );
}
