import { Chapter, Section, Tag } from '../parts'
import styles from '../Showcase.module.css'
import {
  DIMENSIONS,
  DOCUMENTED_SPACING,
  EXTRA_COLORS,
  GRAYS,
  OBSERVED_COLORS,
  RADII,
  SHADOWS,
  SPACING,
  TYPE_STYLES,
  type ColorToken,
} from '../tokens'
import { useCssVars } from '../useCssVar'

function Swatch({ token, value }: { token: ColorToken; value?: string }) {
  return (
    <div className={styles.swatch}>
      <div className={styles.swatchSample} style={{ background: `var(${token.variable})` }} />
      <p className="cf-text-body-medium">{token.name}</p>
      <p className="cf-text-caption cf-text-secondary">
        {value?.toUpperCase()} · {token.role}
      </p>
      <code className={styles.code}>{token.variable}</code>
    </div>
  )
}

export function Foundations() {
  const allVars = [
    ...OBSERVED_COLORS.map((c) => c.variable),
    ...EXTRA_COLORS.map((c) => c.variable),
    ...GRAYS.map((g) => g.variable),
    ...DIMENSIONS.map(([v]) => v),
  ]
  const values = useCssVars(allVars)

  return (
    <Chapter
      id="foundations"
      index="01"
      title="Foundations"
      nodeId="12:10929"
      description="Color, type, spacing, geometry and elevation tokens. Every value lives in src/tokens/tokens.css and is read from there by this page. Figma describes these as screenshot-derived estimates, not an official Campfire specification."
    >
      <div className={styles.callout}>
        <p className={styles.calloutTitle}>How to read the evidence tags</p>
        <p className={styles.note}>
          <Tag kind="observed" /> seen in the product screenshots. <Tag kind="inferred" /> estimated by the Figma author.{' '}
          <Tag kind="suggested" /> offered in Figma for future use, not extracted. <Tag kind="proposed" /> a choice made in this
          build or marked proposed in Figma, listed under Flags.
        </p>
      </div>

      <Section
        title="Color roles"
        note="Figma's foundations call primary neutral ink and lime a selective accent, but the Primary button component is filled lime (see Flags). Orange belongs to the logo."
        tags={<Tag kind="observed" />}
      >
        <div className={styles.grid4}>
          {OBSERVED_COLORS.map((c) => (
            <Swatch key={c.variable} token={c} value={values[c.variable]} />
          ))}
        </div>
      </Section>

      <Section title="Additional color tokens" note="Bound in Figma but outside the palette page, or proposed there.">
        <div className={styles.grid4}>
          {EXTRA_COLORS.map((c) => (
            <div key={c.variable} className={styles.specimen}>
              <Swatch token={c} value={values[c.variable]} />
              <Tag kind={c.evidence === 'proposed' ? 'proposed' : 'observed'} />
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Grayscale"
        note="Interpolated steps for future token creation. Figma calls these suggestions, not extracted product colors."
        tags={<Tag kind="suggested" />}
      >
        <div className={styles.grayRow}>
          {GRAYS.map((g) => (
            <div key={g.variable} className={styles.specimen}>
              <div className={styles.graySample} style={{ background: `var(${g.variable})` }} />
              <p className="cf-text-caption">
                {g.name} · {values[g.variable]?.toUpperCase()}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Typography"
        note="Inter (medium-confidence match) at 400, 500 and 600, self-hosted with @fontsource/inter. Use the cf-text-* classes or the --text-* tokens."
        tags={<Tag kind="inferred" />}
      >
        <table className={styles.tokenTable}>
          <thead>
            <tr>
              <th scope="col">Role</th>
              <th scope="col">Specimen</th>
              <th scope="col">Size / line · weight</th>
              <th scope="col">Class</th>
            </tr>
          </thead>
          <tbody>
            {TYPE_STYLES.map((t) => (
              <tr key={t.role}>
                <th scope="row" className="cf-text-body">
                  {t.role}
                  <br />
                  <span className="cf-text-caption cf-text-secondary">{t.use}</span>
                </th>
                <td>
                  <span className={t.className}>{t.sample}</span>
                </td>
                <td className="cf-text-caption cf-text-secondary">{t.spec}</td>
                <td>
                  <code>.{t.className}</code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className={styles.note}>
          Also in use: 12/20 for table headers and cells, 11/20 for the reporting breadcrumb, 11/16 semibold for subtotal accounts.
          Documentation styles (28/36, 18/24, 14/20) are used by this page's chrome.
        </p>
      </Section>

      <Section
        title="Spacing"
        note="A 4 px base. Figma documents 4 to 48; components also bind 2, 6, 10, 14 and 20, shown here with a dashed tag."
        tags={<Tag kind="inferred" />}
      >
        <div className={styles.row}>
          {SPACING.map((s) => (
            <div key={s} className={styles.spacingItem}>
              <div className={styles.spacingBar} style={{ width: `var(--spacing-${s})` }} />
              <span className="cf-text-body">{s} px</span>
              {!DOCUMENTED_SPACING.has(s) && <Tag kind="proposed">Off scale</Tag>}
            </div>
          ))}
        </div>
      </Section>

      <Section title="Radius and elevation" tags={<Tag kind="inferred" />}>
        <div className={styles.grid4}>
          {RADII.map((r) => (
            <div key={r.variable} className={styles.specimen}>
              <div className={styles.radiusBox} style={{ borderRadius: `var(${r.variable})` }}>
                <span className="cf-text-body">{r.label}</span>
              </div>
              <span className="cf-text-caption cf-text-secondary">{r.use}</span>
            </div>
          ))}
          {SHADOWS.map((s) => (
            <div key={s.variable} className={styles.specimen}>
              <div className={styles.shadowBox} style={{ boxShadow: `var(${s.variable})` }}>
                <span className="cf-text-body">{s.label}</span>
              </div>
              <Tag kind={s.evidence} />
            </div>
          ))}
        </div>
      </Section>

      <Section title="Component dimensions" note="Geometry guidance from the Figma files, all marked inferred.">
        <table className={styles.tokenTable}>
          <thead>
            <tr>
              <th scope="col">Token</th>
              <th scope="col">Value</th>
              <th scope="col">Used by</th>
            </tr>
          </thead>
          <tbody>
            {DIMENSIONS.map(([v, use]) => (
              <tr key={v}>
                <th scope="row">
                  <code>{v}</code>
                </th>
                <td className="cf-text-body">{values[v]}</td>
                <td className="cf-text-body cf-text-secondary">{use}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section
        title="Themes"
        note="Figma documents no color themes (no dark mode). It documents two selection recipes on one neutral shell: lime for the dashboard and neutral for financial reporting. Both are shown under Navigation."
      />
    </Chapter>
  )
}
