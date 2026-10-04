import { BRAND, ICONS, brandUrl, iconSvg, type IconName } from '../../assets/manifest'
import { Button, Icon, Logo } from '../../components'
import { Chapter, FigmaLink, Section, Specimen, Tag } from '../parts'
import styles from '../Showcase.module.css'

const SUGGESTED = ICONS.filter((i) => i.evidence === 'suggested')
/** Observed icons drawn on the same full 24 px canvas, for comparison with the suggested set. */
const OBSERVED_UTILITY: IconName[] = ['calendar', 'filter', 'save', 'trash', 'plus', 'x', 'arrow-up-right']
/** Observed navigation glyphs drawn at 75% (18 px) of the canvas. */
const OBSERVED_NAV: IconName[] = ['home', 'chart', 'revenue', 'accounting', 'wallet', 'ember']

export function Assets() {
  const missingIcons = ICONS.filter((i) => !iconSvg(i.name, 24)).length
  const missingBrand = (Object.keys(BRAND) as (keyof typeof BRAND)[]).filter((k) => !brandUrl(k)).length

  return (
    <Chapter
      id="assets"
      index="02"
      title="Logo and icons"
      nodeId="12:11103"
      description="The icons are generated from the vector data of the Figma icon components. Figma labels them screenshot-derived reconstructions, not original Campfire artwork. The logo is the supplied transparent PNG; a dashed box marks it until the file is added."
    >
      <div className={styles.callout} role="status">
        <p className={styles.calloutTitle}>Icons are Figma reconstructions</p>
        <p className={styles.note}>
          All {ICONS.length} icons come from the Figma icon components (12:12143 to 12:12167, plus lock 38:7923), re-read
          after the icon update on 2026-10-04. Figma describes them as "screenshot-derived reconstruction; geometry is
          estimated". They are rebuilt from the vector paths by scripts/figma/build-icons.mjs and match Figma's renders of
          the components to within 1% of inked pixels. Smaller sizes keep Figma's 1.5 px stroke, as Figma's own 16, 14 and
          12 px instances do.
          {missingIcons > 0 && ` ${missingIcons} icon files are missing.`}
        </p>
      </div>
      {missingBrand > 0 && (
        <div className={styles.callout} role="status">
          <p className={styles.calloutTitle}>The logo and mark are waiting for a manual export</p>
          <p className={styles.note}>
            The environment still cannot download from www.figma.com. Export the layers "Campfire/Brand/Campfire logo/High
            resolution" (12:12168) and "Campfire/Brand/Campfire mark/High resolution" (12:12169) as PNG at 4x, and save them
            as src/assets/brand/campfire-logo.png and campfire-mark.png.
          </p>
        </div>
      )}

      <Section
        title="Campfire artwork"
        note="Supplied high-resolution PNG with a transparent background: lowercase lettering, five-ray orange mark (#FF852F), dark-green wordmark (#142E25). There is no SVG source in Figma, and the PNG is used as supplied."
      >
        <div className={styles.row}>
          <Specimen
            label="Logo / lockup"
            tags={!brandUrl('logo') && <Tag kind="pending" />}
            note={`${BRAND.logo.width} × ${BRAND.logo.height} display · ${BRAND.logo.source} · src/assets/brand/${BRAND.logo.file}`}
          >
            <Logo />
            <FigmaLink nodeId={BRAND.logo.nodeId} />
          </Specimen>
          <Specimen
            label="Logo / mark"
            tags={!brandUrl('mark') && <Tag kind="pending" />}
            note={`${BRAND.mark.width} × ${BRAND.mark.height} box · ${BRAND.mark.source} · src/assets/brand/${BRAND.mark.file}`}
          >
            <Logo variant="mark" />
            <FigmaLink nodeId={BRAND.mark.nodeId} />
          </Specimen>
          <div className={styles.callout} style={{ maxWidth: 344 }}>
            <p className={styles.calloutTitle}>Quiet brand treatment</p>
            <p className={styles.note}>
              Keep the mark in the sidebar header. Orange belongs to the logo; the dashboard's selected state uses lime.
            </p>
          </div>
        </div>
      </Section>

      <Section
        title="Outline icon set"
        note="24 px canvases. Navigation glyphs sit at 75% (18 px) and chevrons at 62.5% (15 px); utility icons fill the canvas. Each tile shows the icon at 24, 16 and 12 px. Strokes are 1.5 px in color/text/secondary at every size."
      >
        <div className={styles.iconGrid}>
          {ICONS.map((icon) => (
            <div key={icon.name} className={styles.iconCell}>
              <div className={styles.iconView}>
                <Icon name={icon.name} size={24} />
                <Icon name={icon.name} size={16} />
                <Icon name={icon.name} size={12} />
              </div>
              <p className="cf-text-body">{icon.label}</p>
              <p className="cf-text-caption cf-text-secondary">
                <code className={styles.code}>{icon.name}</code>
                {'artwork' in icon ? ` · ${icon.artwork} artwork` : ''}
              </p>
              <div className={styles.rowTight}>
                {icon.evidence === 'unclassified' ? (
                  <Tag kind="inferred">No evidence note</Tag>
                ) : (
                  <Tag kind={icon.evidence} />
                )}
                <Tag kind="inferred">Reconstruction</Tag>
              </div>
              <FigmaLink nodeId={icon.nodeId} />
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="The seven suggested additions"
        note="Edit, download, search, check, panel, settings and help are Figma's suggested utility icons, not icons seen in the product screenshots. They are shown together here, next to the observed icons they would sit beside, so their fit can be judged."
      >
        <div className={styles.stack}>
          <Specimen label="Suggested set at 24, 16 and 12 px" tags={<Tag kind="suggested" />}>
            <div className={styles.iconCompare}>
              {[24, 16, 12].map((size) => (
                <div key={size} className={styles.iconStrip}>
                  <span className={`cf-text-caption cf-text-secondary ${styles.iconStripLabel}`}>{size} px</span>
                  {SUGGESTED.map((icon) => (
                    <Icon key={icon.name} name={icon.name} size={size as 24 | 16 | 12} label={icon.label} />
                  ))}
                </div>
              ))}
            </div>
          </Specimen>
          <Specimen label="Observed utility icons at 24 and 16 px, for comparison" tags={<Tag kind="observed" />}>
            <div className={styles.iconCompare}>
              {[24, 16].map((size) => (
                <div key={size} className={styles.iconStrip}>
                  <span className={`cf-text-caption cf-text-secondary ${styles.iconStripLabel}`}>{size} px</span>
                  {OBSERVED_UTILITY.map((name) => (
                    <Icon key={name} name={name} size={size as 24 | 16} />
                  ))}
                </div>
              ))}
            </div>
          </Specimen>
          <Specimen label="Observed navigation glyphs at 24 and 16 px, for comparison" tags={<Tag kind="observed" />}>
            <div className={styles.iconCompare}>
              {[24, 16].map((size) => (
                <div key={size} className={styles.iconStrip}>
                  <span className={`cf-text-caption cf-text-secondary ${styles.iconStripLabel}`}>{size} px</span>
                  {OBSERVED_NAV.map((name) => (
                    <Icon key={name} name={name} size={size as 24 | 16} />
                  ))}
                </div>
              ))}
            </div>
          </Specimen>
          <Specimen
            label="In existing controls: 36 px icon-only buttons with 16 px icons"
            tags={<Tag kind="proposed">Preview, not a Figma layout</Tag>}
            note="Uses the existing secondary and ghost icon-only buttons. Figma does not place the suggested icons in any screen."
          >
            <div className={styles.rowTight}>
              {SUGGESTED.map((icon) => (
                <Button key={icon.name} variant="secondary" iconOnly icon={icon.name} aria-label={icon.label} />
              ))}
            </div>
            <div className={styles.rowTight}>
              {SUGGESTED.map((icon) => (
                <Button key={icon.name} variant="ghost" iconOnly icon={icon.name} aria-label={icon.label} />
              ))}
            </div>
          </Specimen>
          <div className={styles.callout}>
            <p className={styles.calloutTitle}>How they fit</p>
            <ul className={styles.flagList}>
              <li>
                Except settings, stroke and color match the observed set: 1.5 px outlines in color/text/secondary, round caps.
              </li>
              <li>
                Like the observed utility icons (calendar, filter, save, trash), they fill the whole 24 px canvas, so they read
                larger than the navigation glyphs, which sit at 18 px. Use them in toolbars and buttons, not in the side
                navigation.
              </li>
              <li>
                Panel is described in Figma as 75% artwork, but its outline is drawn edge to edge at 24 px. Its 16 px instance
                (38:5739) also thins the stroke to 1 px, the only icon that does.
              </li>
              <li>
                Settings is now a solid gear (a filled shape, no stroke), the only filled icon in the set. It reads heavier
                than the 1.5 px outlines beside it.
              </li>
              <li>
                Search's handle sits about 0.25 px lower in the 12 px instance (28:8962) than a straight scale of the component.
                The files follow the component.
              </li>
              <li>Check appears in green on one Figma instance (28:8918). The color rule for that state is not documented.</li>
            </ul>
          </div>
        </div>
      </Section>
    </Chapter>
  )
}
