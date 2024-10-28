import { Color, Palette, Palettes, PaletteScheme, PaletteType } from "@/utils/palette";
import { Button, ButtonGroup, Menu, MenuItem } from "@blueprintjs/core";
import { ItemRendererProps, MultiSelect, Select } from "@blueprintjs/select";
import { TextIcon } from "./texticon";
import { useEffect, useMemo, useState } from "react";
import styles from "./page.module.scss";

const disabledPalette = Palettes.getPalette("LightGray");
const disabledColor = disabledPalette.getColor(2);

export function RenderColor({
  color,
  index,
  options,
}: {
  color: Color;
  index?: number;
  options?: { textRenderer?: (color: Color, index: number) => string };
}) {
  return <TextIcon text={options?.textRenderer?.(color, index ?? 0) ?? ""} color={color.valueOf()} />;
}

export function RenderPalette({
  palette,
  options,
}: {
  palette: Palette;
  options: { textRenderer?: (color: Color, index: number) => string };
}) {
  return [...palette].map((c, i) => <RenderColor key={`${c}`} color={c} index={i} options={options} />);
}

export function ColorChooser({
  palette,
  color,
  onChange,
  options,
}: {
  palette: Palette;
  color?: Color;
  onChange?: (color: Color, index: number) => void;
  options?: { textRenderer?: (color: Color, index: number) => string };
}) {
  return (
    <ButtonGroup minimal>
      {[...palette].map((c, i) =>
        onChange ? (
          <Button
            className={styles.color}
            key={`${c}`}
            icon={<RenderColor key={`${c}`} color={c} index={i} options={options} />}
            active={c === color}
            onClick={() => onChange(c, i)}
            radioGroup="palette"
            minimal
          />
        ) : (
          <RenderColor key={`${c}`} color={c} index={i} options={options} />
        )
      )}
    </ButtonGroup>
  );
}

export function PalettePicker({
  palettes,
  palette,
  color,
  onChange,
  onColorChange,
  options,
  children,
}: {
  palettes: Palettes;
  palette?: Palette;
  color?: Color;
  onChange?: (palette: Palette, index: number) => void;
  onColorChange?: (color: Color, index: number) => void;
  options?: { textRenderer?: (color: Color, index: number) => string; filterable?: boolean };
  children?: React.ReactNode;
}) {
  const items = useMemo(() => [...palettes], [palettes]);

  return (
    <Select<Palette>
      items={items}
      onItemSelect={(p) => onChange?.(p, items.indexOf(p))}
      itemRenderer={(p, { handleClick, handleFocus, modifiers, query }) => {
        if (query && !modifiers.matchesPredicate) {
          return null;
        }
        return (
          <MenuItem
            key={p.name}
            label={p.name}
            active={p.name === palette?.name}
            text={
              <ButtonGroup minimal>
                {[...p].map((c, i) =>
                  onColorChange ? (
                    <Button
                      className={styles.color}
                      key={`${c}`}
                      icon={<RenderColor key={`${c}`} color={c} index={i} options={options} />}
                      active={c === color}
                      onClick={() => onColorChange(c, i)}
                      radioGroup="palette"
                      minimal
                    />
                  ) : (
                    <RenderColor key={`${c}`} color={c} index={i} options={options} />
                  )
                )}
              </ButtonGroup>
            }
            onClick={handleClick}
            onFocus={handleFocus}
          />
        );
      }}
      itemPredicate={(query, v) => v.name.toLowerCase().includes(query.toLowerCase())}
      filterable={options?.filterable ?? false}
    >
      {children ?? (
        <RenderPalette palette={palette ?? disabledPalette} options={{ textRenderer: options?.textRenderer }} />
      )}
    </Select>
  );
}

export function ColorPicker({
  palettes,
  palette,
  color,
  onChange,
  onPaletteChange,
  options,
  children,
}: {
  palettes: Palettes;
  palette?: Palette;
  color?: Color;
  onChange?: (color: Color, index: number) => void;
  onPaletteChange?: (palette: Palette, index: number) => void;
  options?: { textRenderer?: (color: Color, index: number) => string; filterable?: boolean };
  children?: React.ReactNode;
}) {
  const items = useMemo(() => [...palettes], [palettes]);

  return (
    <Select<Palette>
      items={items}
      onItemSelect={(p) => onPaletteChange?.(p, items.indexOf(p))}
      itemRenderer={(p, { handleClick, handleFocus, modifiers, query }) => {
        if (query && !modifiers.matchesPredicate) {
          return null;
        }
        return (
          <MenuItem
            key={p.name}
            label={p.name}
            active={p.name === palette?.name}
            text={
              <ButtonGroup minimal>
                {[...p].map((c, i) => (
                  <Button
                    className={styles.color}
                    key={`${c}`}
                    icon={<RenderColor key={`${c}`} color={c} index={i} options={options} />}
                    active={c === color}
                    onClick={() => onChange?.(c, i)}
                    radioGroup="palette"
                    minimal
                  />
                ))}
              </ButtonGroup>
            }
            onClick={handleClick}
            onFocus={handleFocus}
          />
        );
      }}
      itemPredicate={(query, v) => v.name.toLowerCase().includes(query.toLowerCase())}
      filterable={options?.filterable ?? false}
    >
      {children ?? <RenderColor color={color ?? disabledColor} options={options} />}
    </Select>
  );
}

function itemRenderer(item: PaletteScheme | PaletteType | string, props: ItemRendererProps) {
  return <MenuItem key={item} text={item} onClick={props.handleClick} />;
}

function tagRenderer(tag: PaletteScheme | PaletteType | string) {
  return tag;
}

function noItemsRenderer() {
  return (
    <Menu>
      <MenuItem text="No more filters available" disabled />
    </Menu>
  );
}

export function PaletteFilter({ palettes, onChange }: { palettes: Palettes; onChange: (palettes: Palettes) => void }) {
  const [tags, setTags] = useState<(PaletteScheme | PaletteType | string)[]>([]);
  const [items, setItems] = useState<(PaletteScheme | PaletteType | string)[]>([
    ...palettes.types,
    ...palettes.schemes,
  ]);

  useEffect(() => {
    const types = tags.filter((v) => palettes.types.includes(v));
    const schemes = tags.filter((v) => palettes.schemes.includes(v));
    const filtered = palettes.getPalettes({
      ...(types.length > 0 ? { types } : {}),
      ...(schemes.length > 0 ? { schemes } : {}),
    });
    onChange(filtered);
    setItems([...filtered.types, ...filtered.schemes].filter((v) => !tags.includes(v)));
  }, [tags, palettes, onChange]);

  return (
    <MultiSelect
      items={items}
      itemRenderer={itemRenderer}
      tagRenderer={tagRenderer}
      selectedItems={tags}
      onItemSelect={(v) => setTags([...tags, v])}
      onRemove={(t) => setTags((s) => s.filter((v) => v !== t))}
      onClear={() => setTags([])}
      placeholder="Filter palettes..."
      itemListRenderer={items.length > 0 ? undefined : () => noItemsRenderer()}
    />
  );
}
