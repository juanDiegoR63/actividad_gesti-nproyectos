import React, { useEffect, useMemo, useState } from "react";
import { useGameStore } from "../core/store/gameStore";
import { audioService } from "../core/services/audioService";
import {
  FACE_STYLE_OPTIONS,
  GENDER_OPTIONS,
  PANTS_COLOR_OPTIONS,
  SHOE_STYLE_OPTIONS,
  SHIRT_COLOR_OPTIONS,
  SKIN_TONE_OPTIONS,
  getHairOptionsByGender,
  getPantsStyleOptionsByGender,
  getShirtStyleOptionsByGender,
  getDefaultRoleCosmetics,
} from "../data/characterCosmetics";

const roleMeta = [
  { key: "director", label: "Director de Proyecto" },
  { key: "planning", label: "Gerente de Planificacion" },
  { key: "quality", label: "Lider de Calidad" },
];

const ROLE_PALETTE = {
  director: {
    hair: "#333333",
    shoes: "#111827",
    body: "#1f9d8a",
  },
  planning: {
    hair: "#78350f",
    shoes: "#0f172a",
    body: "#3b82f6",
  },
  quality: {
    hair: "#1f2937",
    shoes: "#1f2937",
    body: "#f59e0b",
  },
};

const SKIN_TONE_COLORS = {
  light: "#f8dfc5",
  medium: "#e8c09b",
  tan: "#c99570",
  dark: "#8d5c3b",
};

const SHIRT_COLORS = {
  teal: "#0d9488",
  navy: "#1e3a8a",
  maroon: "#7f1d1d",
  olive: "#4d7c0f",
  gray: "#475569",
  white: "#f8fafc",
};

const PANTS_COLORS = {
  black: "#334155",
  charcoal: "#374151",
  navy: "#1e3a8a",
  brown: "#7c2d12",
  khaki: "#a16207",
};

const FACE_MOUTH = {
  smile: { color: "#f43f5e", width: 6 },
  neutral: { color: "#64748b", width: 6 },
  focus: { color: "#1d4ed8", width: 5 },
  serious: { color: "#111827", width: 6 },
};

function PixelRect({ x, y, w, h, color, opacity = 1 }) {
  return (
    <div
      className="absolute"
      style={{
        left: x,
        top: y,
        width: w,
        height: h,
        backgroundColor: color,
        opacity,
      }}
    />
  );
}

function HairLayer({ hairStyle, hairColor }) {
  if (hairStyle === "long_wavy") {
    return <PixelRect x={40} y={1} w={22} h={9} color={hairColor} />;
  }

  if (hairStyle === "ponytail") {
    return (
      <>
        <PixelRect x={41} y={2} w={20} h={5} color={hairColor} />
        <PixelRect x={60} y={7} w={4} h={7} color={hairColor} />
      </>
    );
  }

  if (hairStyle === "bob_cut") {
    return (
      <>
        <PixelRect x={40} y={2} w={22} h={7} color={hairColor} />
        <PixelRect x={39} y={6} w={2} h={5} color={hairColor} />
        <PixelRect x={61} y={6} w={2} h={5} color={hairColor} />
      </>
    );
  }

  if (hairStyle === "braids") {
    return (
      <>
        <PixelRect x={41} y={2} w={20} h={4} color={hairColor} />
        <PixelRect x={40} y={6} w={2} h={8} color={hairColor} />
        <PixelRect x={60} y={6} w={2} h={8} color={hairColor} />
      </>
    );
  }

  if (hairStyle === "curly") {
    return (
      <>
        <PixelRect x={41} y={2} w={4} h={4} color={hairColor} />
        <PixelRect x={47} y={0} w={4} h={6} color={hairColor} />
        <PixelRect x={53} y={1} w={4} h={5} color={hairColor} />
        <PixelRect x={58} y={2} w={3} h={4} color={hairColor} />
      </>
    );
  }

  if (hairStyle === "side_part") {
    return (
      <>
        <PixelRect x={41} y={2} w={20} h={5} color={hairColor} />
        <PixelRect x={56} y={2} w={1} h={5} color="#e2e8f0" opacity={0.55} />
      </>
    );
  }

  return <PixelRect x={41} y={2} w={20} h={4} color={hairColor} />;
}

function ShirtDetailLayer({ shirtStyle }) {
  if (shirtStyle === "formal_blazer") {
    return (
      <>
        <PixelRect x={48} y={16} w={1} h={8} color="#e2e8f0" opacity={0.55} />
        <PixelRect x={52} y={16} w={1} h={8} color="#e2e8f0" opacity={0.55} />
        <PixelRect x={50} y={16} w={1} h={20} color="#111827" opacity={0.75} />
      </>
    );
  }

  if (shirtStyle === "polo") {
    return <PixelRect x={48} y={16} w={4} h={3} color="#e2e8f0" opacity={0.5} />;
  }

  if (shirtStyle === "blouse") {
    return (
      <>
        <PixelRect x={47} y={16} w={6} h={2} color="#f8fafc" opacity={0.5} />
        <PixelRect x={50} y={18} w={1} h={3} color="#f8fafc" opacity={0.5} />
      </>
    );
  }

  if (shirtStyle === "dress_shirt") {
    return (
      <>
        <PixelRect x={50} y={16} w={1} h={20} color="#e2e8f0" opacity={0.6} />
        <PixelRect x={48} y={16} w={5} h={2} color="#e2e8f0" opacity={0.5} />
      </>
    );
  }

  return null;
}

function PantsDetailLayer({ pantsStyle }) {
  if (pantsStyle === "skirt") {
    return (
      <>
        <PixelRect x={40} y={36} w={22} h={8} color="#111827" opacity={0.15} />
        <PixelRect x={42} y={44} w={18} h={2} color="#111827" opacity={0.12} />
      </>
    );
  }

  if (pantsStyle === "jeans") {
    return <PixelRect x={40} y={38} w={22} h={1} color="#93c5fd" opacity={0.5} />;
  }

  if (pantsStyle === "cargo") {
    return (
      <>
        <PixelRect x={41} y={44} w={2} h={3} color="#111827" opacity={0.35} />
        <PixelRect x={59} y={44} w={2} h={3} color="#111827" opacity={0.35} />
      </>
    );
  }

  return null;
}

function FaceLayer({ faceStyle }) {
  const mouth = FACE_MOUTH[faceStyle] ?? FACE_MOUTH.neutral;

  if (faceStyle === "smile") {
    return (
      <>
        <PixelRect x={46} y={8} w={2} h={2} color="#111827" />
        <PixelRect x={54} y={8} w={2} h={2} color="#111827" />
        <PixelRect x={44} y={11} w={1} h={1} color="#fda4af" opacity={0.45} />
        <PixelRect x={57} y={11} w={1} h={1} color="#fda4af" opacity={0.45} />
        <PixelRect x={48} y={12} w={4} h={1} color={mouth.color} />
        <PixelRect x={47} y={11} w={1} h={1} color={mouth.color} />
        <PixelRect x={52} y={11} w={1} h={1} color={mouth.color} />
      </>
    );
  }

  if (faceStyle === "focus") {
    return (
      <>
        <PixelRect x={45} y={7} w={3} h={1} color="#111827" opacity={0.85} />
        <PixelRect x={54} y={7} w={3} h={1} color="#111827" opacity={0.85} />
        <PixelRect x={46} y={8} w={2} h={2} color="#111827" />
        <PixelRect x={54} y={8} w={2} h={2} color="#111827" />
        <PixelRect x={48} y={12} w={mouth.width} h={1} color={mouth.color} />
      </>
    );
  }

  if (faceStyle === "serious") {
    return (
      <>
        <PixelRect x={45} y={7} w={3} h={1} color="#111827" />
        <PixelRect x={54} y={7} w={3} h={1} color="#111827" />
        <PixelRect x={46} y={8} w={2} h={2} color="#111827" />
        <PixelRect x={54} y={8} w={2} h={2} color="#111827" />
        <PixelRect x={48} y={12} w={mouth.width} h={1} color={mouth.color} />
      </>
    );
  }

  return (
    <>
      <PixelRect x={46} y={8} w={2} h={2} color="#111827" />
      <PixelRect x={54} y={8} w={2} h={2} color="#111827" />
      <PixelRect x={48} y={12} w={mouth.width} h={1} color={mouth.color} />
    </>
  );
}

function ShoesLayer({ shoeStyle, shoesColor }) {
  let color = shoesColor;
  if (shoeStyle === "sneakers") {
    color = "#e2e8f0";
  } else if (shoeStyle === "dress") {
    color = "#0f172a";
  }

  return (
    <>
      <PixelRect x={40} y={55} w={7} h={3} color={color} />
      <PixelRect x={55} y={55} w={7} h={3} color={color} />
    </>
  );
}

function PixelAvatar({ role, cosmetic }) {
  const palette = ROLE_PALETTE[role];
  const headColor = SKIN_TONE_COLORS[cosmetic.skinTone] ?? SKIN_TONE_COLORS.medium;
  const shirtColor = SHIRT_COLORS[cosmetic.shirtColor] ?? palette.body;
  const pantsColor = PANTS_COLORS[cosmetic.pantsColor] ?? "#1f2937";
  const isSkirt = cosmetic.pantsStyle === "skirt";
  const isFemale = cosmetic.gender === "female";

  return (
    <div className="relative h-[336px] w-[124px] overflow-hidden border-2 border-slate-600 bg-[#0f172a] [image-rendering:pixelated]">
      <div className="absolute left-1/2 top-1/2">
        <div style={{ transform: "translate(-51px, -30px)" }}>
        <div
          className="relative h-[80px] w-[124px]"
          style={{
            transformOrigin: "51px 30px",
            transform: "scaleX(3) scaleY(4.05)",
          }}
        >
        {isFemale ? (
          <>
            <PixelRect x={35} y={16} w={32} h={12} color={shirtColor} />
            <PixelRect x={37} y={28} w={28} h={6} color={shirtColor} />
            <PixelRect x={33} y={21} w={2} h={10} color={shirtColor} />
            <PixelRect x={65} y={21} w={2} h={10} color={shirtColor} />
          </>
        ) : (
          <>
            <PixelRect x={35} y={16} w={32} h={20} color={shirtColor} />
            <PixelRect x={32} y={21} w={3} h={10} color={shirtColor} />
            <PixelRect x={66} y={21} w={3} h={10} color={shirtColor} />
          </>
        )}

        {isSkirt ? (
          <>
            <PixelRect x={40} y={36} w={22} h={10} color={pantsColor} />
            <PixelRect x={45} y={46} w={4} h={3} color={pantsColor} />
            <PixelRect x={53} y={46} w={4} h={3} color={pantsColor} />
          </>
        ) : (
          <>
            <PixelRect x={40} y={38} w={8} h={16} color={pantsColor} />
            <PixelRect x={54} y={38} w={8} h={16} color={pantsColor} />
          </>
        )}

        <PixelRect x={42} y={4} w={18} h={12} color={headColor} />

        <HairLayer hairStyle={cosmetic.hairStyle} hairColor={palette.hair} />
        <ShirtDetailLayer shirtStyle={cosmetic.shirtStyle} />
        <PantsDetailLayer pantsStyle={cosmetic.pantsStyle} />
        <FaceLayer faceStyle={cosmetic.faceStyle} />
        <ShoesLayer shoeStyle={cosmetic.shoeStyle} shoesColor={palette.shoes} />
        </div>
        </div>
      </div>
    </div>
  );
}

function CosmeticSelect({ label, value, options, onChange }) {
  return (
    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
      {label}
      <select
        value={value}
        onChange={onChange}
        className="mt-1 w-full border-2 border-slate-600 bg-slate-900 px-2 py-1.5 text-xs text-slate-100 outline-none focus:border-amber-300"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function TurnSetupScreen() {
  const startRun = useGameStore((state) => state.startRun);
  const backToMenu = useGameStore((state) => state.backToMenu);

  const [teamName, setTeamName] = useState("Equipo PMBOK");
  const [members, setMembers] = useState({
    director: "Director",
    planning: "Planning",
    quality: "Calidad",
  });
  const [cosmetics, setCosmetics] = useState(() => getDefaultRoleCosmetics());

  const ensureOption = (options, currentValue, fallbackValue) => {
    if (options.some((option) => option.value === currentValue)) {
      return currentValue;
    }

    if (options.some((option) => option.value === fallbackValue)) {
      return fallbackValue;
    }

    return options[0]?.value ?? currentValue;
  };

  const updateGender = (roleKey, nextGender) => {
    setCosmetics((prev) => {
      const current = prev[roleKey];
      const defaultRole = getDefaultRoleCosmetics()[roleKey];

      const hairOptions = getHairOptionsByGender(nextGender);
      const shirtOptions = getShirtStyleOptionsByGender(nextGender);
      const pantsOptions = getPantsStyleOptionsByGender(nextGender);

      return {
        ...prev,
        [roleKey]: {
          ...current,
          gender: nextGender,
          hairStyle: ensureOption(hairOptions, current.hairStyle, defaultRole.hairStyle),
          shirtStyle: ensureOption(shirtOptions, current.shirtStyle, defaultRole.shirtStyle),
          pantsStyle: ensureOption(pantsOptions, current.pantsStyle, defaultRole.pantsStyle),
        },
      };
    });
  };

  const updateCosmetic = (roleKey, field, value) => {
    setCosmetics((prev) => ({
      ...prev,
      [roleKey]: {
        ...prev[roleKey],
        [field]: value,
      },
    }));
  };

  const canStart = useMemo(() => {
    return (
      teamName.trim().length > 0 &&
      roleMeta.every(({ key }) => members[key].trim().length > 0)
    );
  }, [members, teamName]);

  useEffect(() => {
    audioService.playMusic("creation");
  }, []);

  const handleBack = async () => {
    await audioService.unlock();
    audioService.playSfx("cancel");
    backToMenu();
  };

  const handleStartRun = async () => {
    await audioService.unlock();
    audioService.playSfx("confirm");
    startRun({
      teamName,
      members,
      cosmetics,
    });
  };

  return (
    <div className="mx-auto min-h-[100dvh] w-full max-w-[1520px] px-3 py-3 sm:px-6 sm:py-6">
      <div className="border-4 border-slate-700 bg-slate-900 p-4 shadow-2xl sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Crew Assembly</p>
            <h1 className="mt-2 text-2xl font-black uppercase text-slate-100">
              Creacion de Personajes
            </h1>
          </div>
          <button
            type="button"
            onClick={() => {
              void handleBack();
            }}
            className="border-2 border-slate-600 bg-slate-800 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-200 hover:bg-slate-700"
          >
            Volver
          </button>
        </div>

        <div className="mb-5 border-2 border-slate-700 bg-slate-950 px-4 py-3">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-[260px] flex-1">
              <label htmlFor="team-name" className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
                Nombre del equipo
              </label>
              <input
                id="team-name"
                value={teamName}
                onChange={(event) => setTeamName(event.target.value)}
                className="w-full border-2 border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-300"
                placeholder="Equipo PMBOK"
              />
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {roleMeta.map((role) => {
            const roleCosmetic = cosmetics[role.key];
            const hairOptions = getHairOptionsByGender(roleCosmetic.gender);
            const shirtStyleOptions = getShirtStyleOptionsByGender(roleCosmetic.gender);
            const pantsStyleOptions = getPantsStyleOptionsByGender(roleCosmetic.gender);

            return (
            <article key={role.key} className="border-2 border-slate-700 bg-slate-950 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-500">Rol</p>
                  <h2 className="mt-1 text-base font-bold text-slate-200">{role.label}</h2>
                </div>
                <div className="min-w-[140px]">
                  <label
                    htmlFor={`member-${role.key}`}
                    className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400"
                  >
                    Nombre
                  </label>
                  <input
                    id={`member-${role.key}`}
                    value={members[role.key]}
                    onChange={(event) =>
                      setMembers((prev) => ({
                        ...prev,
                        [role.key]: event.target.value,
                      }))
                    }
                    className="w-full border-2 border-slate-600 bg-slate-900 px-2 py-1.5 text-xs text-slate-100 outline-none focus:border-amber-300"
                    placeholder={role.label}
                  />
                </div>
              </div>

              <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] xl:items-start">
                <div className="grid gap-2">
                  <CosmeticSelect
                    label="Genero"
                    value={roleCosmetic.gender}
                    options={GENDER_OPTIONS}
                    onChange={(event) => updateGender(role.key, event.target.value)}
                  />
                  <CosmeticSelect
                    label="Pelo"
                    value={roleCosmetic.hairStyle}
                    options={hairOptions}
                    onChange={(event) => updateCosmetic(role.key, "hairStyle", event.target.value)}
                  />
                  <CosmeticSelect
                    label="Color de piel"
                    value={roleCosmetic.skinTone}
                    options={SKIN_TONE_OPTIONS}
                    onChange={(event) => updateCosmetic(role.key, "skinTone", event.target.value)}
                  />
                  <CosmeticSelect
                    label="Cara"
                    value={roleCosmetic.faceStyle}
                    options={FACE_STYLE_OPTIONS}
                    onChange={(event) => updateCosmetic(role.key, "faceStyle", event.target.value)}
                  />
                </div>

                <div className="flex items-center justify-center">
                  <PixelAvatar role={role.key} cosmetic={roleCosmetic} />
                </div>

                <div className="grid gap-2">
                  <CosmeticSelect
                    label="Camiseta"
                    value={roleCosmetic.shirtStyle}
                    options={shirtStyleOptions}
                    onChange={(event) => updateCosmetic(role.key, "shirtStyle", event.target.value)}
                  />
                  <CosmeticSelect
                    label="Color camiseta"
                    value={roleCosmetic.shirtColor}
                    options={SHIRT_COLOR_OPTIONS}
                    onChange={(event) => updateCosmetic(role.key, "shirtColor", event.target.value)}
                  />
                  <CosmeticSelect
                    label="Pantalon"
                    value={roleCosmetic.pantsStyle}
                    options={pantsStyleOptions}
                    onChange={(event) => updateCosmetic(role.key, "pantsStyle", event.target.value)}
                  />
                  <CosmeticSelect
                    label="Color pantalon"
                    value={roleCosmetic.pantsColor}
                    options={PANTS_COLOR_OPTIONS}
                    onChange={(event) => updateCosmetic(role.key, "pantsColor", event.target.value)}
                  />
                  <CosmeticSelect
                    label="Zapatos"
                    value={roleCosmetic.shoeStyle}
                    options={SHOE_STYLE_OPTIONS}
                    onChange={(event) => updateCosmetic(role.key, "shoeStyle", event.target.value)}
                  />
                </div>
              </div>
            </article>
            );
          })}
        </div>

        <button
          type="button"
          disabled={!canStart}
          onClick={() => {
            void handleStartRun();
          }}
          className="mt-6 inline-flex items-center justify-center border-2 border-emerald-400 bg-emerald-300 px-8 py-3 text-sm font-black uppercase tracking-wider text-slate-900 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Entrar al combate
        </button>
      </div>
    </div>
  );
}
