import type {
  CharacterCosmetic,
  CharacterRole,
  FaceStyle,
  Gender,
  HairStyle,
  PantsColor,
  PantsStyle,
  ShirtColor,
  ShirtStyle,
  SkinTone,
  ShoeStyle,
} from "../types/game";

type GenderedOption<T> = {
  value: T;
  label: string;
  femaleOnly?: boolean;
};

export const GENDER_OPTIONS: Array<{ value: Gender; label: string }> = [
  { value: "male", label: "Hombre" },
  { value: "female", label: "Mujer" },
];

export const HAIR_STYLE_OPTIONS: GenderedOption<HairStyle>[] = [
  { value: "fade", label: "Degradado" },
  { value: "side_part", label: "Cortecito CR7" },
  { value: "curly", label: "Rizado" },
  { value: "long_wavy", label: "Metalero" },
  { value: "ponytail", label: "Coleta", femaleOnly: true },
  { value: "bob_cut", label: "Bob", femaleOnly: true },
  { value: "braids", label: "Trenzas", femaleOnly: true },
];

export const SKIN_TONE_OPTIONS: Array<{ value: SkinTone; label: string }> = [
  { value: "light", label: "Claro" },
  { value: "medium", label: "Medio" },
  { value: "tan", label: "Trigueno" },
  { value: "dark", label: "Oscuro" },
];

export const SHOE_STYLE_OPTIONS: Array<{ value: ShoeStyle; label: string }> = [
  { value: "dress", label: "Zapato formal" },
  { value: "boots", label: "Botas" },
  { value: "sneakers", label: "Zapatillas" },
];

export const SHIRT_STYLE_OPTIONS: GenderedOption<ShirtStyle>[] = [
  { value: "tshirt", label: "Camiseta" },
  { value: "polo", label: "Polo" },
  { value: "dress_shirt", label: "Camisa" },
  { value: "formal_blazer", label: "Ropa formal" },
  { value: "blouse", label: "Blusa", femaleOnly: true },
];

export const PANTS_STYLE_OPTIONS: GenderedOption<PantsStyle>[] = [
  { value: "jeans", label: "Vaquero" },
  { value: "slacks", label: "Vestir" },
  { value: "cargo", label: "Cargo" },
  { value: "skirt", label: "Falda", femaleOnly: true },
];

export const SHIRT_COLOR_OPTIONS: Array<{ value: ShirtColor; label: string }> = [
  { value: "teal", label: "Verde azulado" },
  { value: "navy", label: "Azul marino" },
  { value: "maroon", label: "Granate" },
  { value: "olive", label: "Oliva" },
  { value: "gray", label: "Gris" },
  { value: "white", label: "Blanco" },
];

export const PANTS_COLOR_OPTIONS: Array<{ value: PantsColor; label: string }> = [
  { value: "black", label: "Negro" },
  { value: "charcoal", label: "Carbon" },
  { value: "navy", label: "Azul marino" },
  { value: "brown", label: "Marron" },
  { value: "khaki", label: "Caqui" },
];

export const FACE_STYLE_OPTIONS: Array<{ value: FaceStyle; label: string }> = [
  { value: "neutral", label: "Neutral" },
  { value: "smile", label: "Sonrisa" },
  { value: "focus", label: "Enfocado" },
  { value: "serious", label: "Serio" },
];

export const DEFAULT_ROLE_COSMETICS: Record<CharacterRole, CharacterCosmetic> = {
  director: {
    gender: "male",
    hairStyle: "side_part",
    skinTone: "light",
    shirtStyle: "formal_blazer",
    shirtColor: "teal",
    pantsStyle: "slacks",
    pantsColor: "black",
    shoeStyle: "dress",
    faceStyle: "serious",
  },
  planning: {
    gender: "male",
    hairStyle: "fade",
    skinTone: "medium",
    shirtStyle: "polo",
    shirtColor: "navy",
    pantsStyle: "jeans",
    pantsColor: "charcoal",
    shoeStyle: "sneakers",
    faceStyle: "focus",
  },
  quality: {
    gender: "female",
    hairStyle: "ponytail",
    skinTone: "tan",
    shirtStyle: "blouse",
    shirtColor: "olive",
    pantsStyle: "skirt",
    pantsColor: "khaki",
    shoeStyle: "boots",
    faceStyle: "neutral",
  },
};

function filterByGender<T extends { femaleOnly?: boolean }>(
  options: T[],
  gender: Gender,
): T[] {
  if (gender === "female") {
    return options;
  }

  return options.filter((option) => !option.femaleOnly);
}

export function getHairOptionsByGender(gender: Gender): Array<{ value: HairStyle; label: string }> {
  return filterByGender(HAIR_STYLE_OPTIONS, gender).map(({ value, label }) => ({ value, label }));
}

export function getShirtStyleOptionsByGender(
  gender: Gender,
): Array<{ value: ShirtStyle; label: string }> {
  return filterByGender(SHIRT_STYLE_OPTIONS, gender).map(({ value, label }) => ({ value, label }));
}

export function getPantsStyleOptionsByGender(
  gender: Gender,
): Array<{ value: PantsStyle; label: string }> {
  return filterByGender(PANTS_STYLE_OPTIONS, gender).map(({ value, label }) => ({ value, label }));
}

export function cloneCosmetic(cosmetic: CharacterCosmetic): CharacterCosmetic {
  return {
    gender: cosmetic.gender,
    hairStyle: cosmetic.hairStyle,
    skinTone: cosmetic.skinTone,
    shirtStyle: cosmetic.shirtStyle,
    shirtColor: cosmetic.shirtColor,
    pantsStyle: cosmetic.pantsStyle,
    pantsColor: cosmetic.pantsColor,
    shoeStyle: cosmetic.shoeStyle,
    faceStyle: cosmetic.faceStyle,
  };
}

export function getDefaultRoleCosmetics(): Record<CharacterRole, CharacterCosmetic> {
  return {
    director: cloneCosmetic(DEFAULT_ROLE_COSMETICS.director),
    planning: cloneCosmetic(DEFAULT_ROLE_COSMETICS.planning),
    quality: cloneCosmetic(DEFAULT_ROLE_COSMETICS.quality),
  };
}
