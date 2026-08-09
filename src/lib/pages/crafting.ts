import type { RecipeItem, RecipeSlot } from '@/lib/reborn-ai/types';

export const craftingSlots = 6;

const folder = '/elements/crafting';

const resourceImages = new Set([
  'aluminum_casing',
  'bounding_fluctuator',
  'duct_tape',
  'emag_accelerator',
  'fittings',
  'frame_extension_unit',
  'gauss_amplifier',
  'grip_tape',
  'hook_latch',
  'kinetic_fabric',
  'magnetic_coil',
  'magnetized_alloy_hook',
  'magnetomotive_calibrator',
  'micro_pulse_driver',
  'microcapacitor',
  'nanotube_cable',
  'override_module',
  'pulse_generator',
  'rail_trigger',
  'rugged_synthetics',
  'slickwrap',
  'springhook_chassis',
  'static_fuse_cable',
  'steel_extension_spring',
  'tension_compressor',
  'vdw_tape',
  'winch_mount',
  'work_gloves',
]);

export function resourceSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[.'’]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function resourceImage(name: string) {
  const slug = resourceSlug(name);
  return `${folder}/${resourceImages.has(slug) ? slug : 'placeholder'}.png`;
}

export const craftingSlot = (name: string): RecipeSlot => ({ name, image: resourceImage(name) });

export function craftingGrid(items: RecipeItem[]): RecipeSlot[] {
  const slots: RecipeSlot[] = [];

  for (const item of items) {
    for (let filled = 0; filled < item.quantity && slots.length < craftingSlots; filled += 1) {
      slots.push(craftingSlot(item.name));
    }
  }

  return slots;
}
