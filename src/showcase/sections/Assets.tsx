import { BRAND, ICONS, brandUrl, iconUrl } from '../../assets/manifest'
import { Icon, Logo } from '../../components'
import { Chapter, FigmaLink, Section, Specimen, Tag } from '../parts'
import styles from '../Showcase.module.css'

export function Assets() {
  const missingIcons = ICONS.filter((i) => !iconUrl(i.name, 24)).length
  const missingBrand = (Object.keys(BRAND) as (keyof typeof BRAND)[]).filter((k) => !brandUrl(k)).length

  return (
    <Chapter
      id="assets"
      index="02"
      title="Logo and icons"
      nodeId="12:11103"
      description="Assets render from exported Figma files without modification. A dashed box marks a slot whose file has not been exported yet; it is drawn at the exact Figma size and is never a substitute glyph."
    >
      {(missingIcons > 0 || missingBrand > 0) && (
        <div className={styles.callout} role="status">
          <p className={styles.calloutTitle}>
            {missingIcons} of {ICONS.length} icons and {missingBrand} of 2 logo files are waiting for export
          </p>
          <p className={styles.note}>
            The Figma asset host (www.figma.com) was blocked by this environment's network policy, so the files could not be
            downloaded. Drop the exports into src/assets/icons and src/assets/brand using the names below and they appear
            everywhere automatically.
          </p>
        </div>
      )}

      <Section
        title="Campfire artwork"
        note="Supplied high-resolution PNG with a transparent background: lowercase lettering, five-ray orange mark (#FF852F), dark-green wordmark (#142E25). There is no SVG source in Figma."
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
        note="24 px canvases with centered artwork: navigation glyphs at 75% (18 px) and chevrons at 62.5% (15 px). Each tile shows the icon at 24 px and at the sizes components use (16 and 12 px). Figma labels every icon a screenshot-derived reconstruction."
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
                <Tag kind={icon.evidence === 'observed' ? 'observed' : 'suggested'} />
                {!iconUrl(icon.name, 24) && <Tag kind="pending" />}
              </div>
              <FigmaLink nodeId={icon.nodeId} />
            </div>
          ))}
        </div>
        <div className={styles.callout}>
          <p className={styles.calloutTitle}>Observed family, supplemented vocabulary</p>
          <p className={styles.note}>
            Navigation glyphs, chevrons, date, save, delete and trend cues follow the visible outline language. Edit, download,
            search, check, panel, settings and help are suggested utility additions, not definitively observed icons.
          </p>
        </div>
      </Section>
    </Chapter>
  )
}
