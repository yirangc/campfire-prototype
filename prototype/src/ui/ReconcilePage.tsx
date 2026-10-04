import { useMemo, useState } from 'react'
import { Button, Icon, InfoTip, MetricCard, Modal, Notice, Select, Tabs, type TabItem } from '../../../src/components'
import { ACCOUNT, BANK_EXCEPTIONS, LEDGER_EXCEPTIONS, OPENING_BALANCE, PERIOD, STATEMENT_IMPORTED } from '../domain/fixture'
import { longDate, money, signed, timestamp } from '../domain/format'
import {
  balances,
  completionBlockers,
  recordCounterparty,
  reviewCases,
  statusCounts,
  type RecordStatus,
  type ReviewCase,
} from '../domain/selectors'
import type { Recon } from '../useRecon'
import { BackgroundPairs } from './BackgroundPairs'
import { CompletionSummary } from './CompletionSummary'
import { HistoryPanel } from './HistoryPanel'
import { Register } from './Register'
import styles from './Page.module.css'

type TabValue = 'all' | RecordStatus

const DEFINITIONS = {
  statement: 'Opening bank balance plus all November bank activity on the imported statement. Fixed for the period.',
  book: 'Opening ledger cash plus November ledger cash activity, including entries created here. Matches never change it.',
  cleared: 'Opening cash plus bank activity that has a confirmed ledger match.',
  difference: 'Book balance minus statement closing minus the documented outstanding adjustment. Must be exactly $0.00 to complete.',
}

function caseMatchesQuery(c: ReviewCase, query: string) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const records = [c.bank, c.ledger].filter(Boolean)
  return records.some((r) =>
    [r!.description, recordCounterparty(r!), r!.reference ?? '', r!.id, r!.kind === 'ledger' ? r!.entryId : '', money(r!.amount)]
      .join(' ')
      .toLowerCase()
      .includes(q),
  )
}

export function ReconcilePage({ recon, announce }: { recon: Recon; announce: (message: string) => void }) {
  const { state, dispatch } = recon
  const [tab, setTab] = useState<TabValue>('all')
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [blockersShown, setBlockersShown] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [pageError, setPageError] = useState<string | null>(null)

  const counts = statusCounts(state)
  const totals = balances(state)
  const cases = useMemo(() => reviewCases(state), [state])
  const blockers = completionBlockers(state)
  const completed = state.completion.status === 'completed'
  const visible = cases.filter((c) => (tab === 'all' || c.status === tab) && caseMatchesQuery(c, query))
  const lastUndo = state.undoStack.at(-1)

  const tabs: TabItem[] = [
    { value: 'all', label: `All (${counts.all})`, width: 96, panelId: 'exceptions-register' },
    { value: 'confirmed', label: `Confirmed (${counts.confirmed})`, width: 132, panelId: 'exceptions-register' },
    { value: 'suggested', label: `Suggested (${counts.suggested})`, width: 132, panelId: 'exceptions-register' },
    { value: 'unmatched', label: `Unmatched (${counts.unmatched})`, width: 132, panelId: 'exceptions-register' },
    { value: 'outstanding', label: `Outstanding (${counts.outstanding})`, width: 132, panelId: 'exceptions-register' },
  ]

  const complete = () => {
    const result = dispatch({ type: 'complete' })
    if (result.ok) {
      setBlockersShown(false)
      setExpanded(null)
      announce('November reconciliation completed. Accounting actions are locked until you reopen it.')
    } else {
      setBlockersShown(true)
      announce(`Can't complete yet. ${result.reason}`)
    }
  }

  const reopen = () => {
    const result = dispatch({ type: 'reopen' })
    if (result.ok) announce('Reconciliation reopened. Your resolutions are kept and editing is available again.')
  }

  const undo = () => {
    const result = dispatch({ type: 'undo' })
    if (result.ok) {
      setPageError(null)
      announce(result.message ?? 'Undone.')
    } else setPageError(result.reason)
  }

  const download = () => {
    const lines = [
      `Campfire reconciliation summary`,
      `${ACCOUNT.name} · ${ACCOUNT.currency} · ${PERIOD.label}`,
      `Status: ${completed ? `Completed by ${state.completion.completedBy} at ${state.completion.completedAt}` : 'In progress'}`,
      '',
      `Statement closing,${(totals.statementClosing / 100).toFixed(2)}`,
      `Book balance,${(totals.book / 100).toFixed(2)}`,
      `Cleared balance,${(totals.cleared / 100).toFixed(2)}`,
      `Outstanding deposits,${(totals.outstandingDeposits / 100).toFixed(2)}`,
      `Outstanding withdrawals,${(totals.outstandingWithdrawals / 100).toFixed(2)}`,
      `Outstanding net adjustment,${(totals.outstandingNet / 100).toFixed(2)}`,
      `Remaining difference,${(totals.difference / 100).toFixed(2)}`,
      `Confirmed records,${counts.confirmed}`,
      `Outstanding records,${counts.outstanding}`,
      `Unresolved records,${counts.unresolved}`,
      '',
      'History',
      ...state.history.map((h) => `${h.at},"${h.summary.replace(/"/g, '""')}",${h.recordIds.join(' ')}`),
    ]
    const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'campfire-reconciliation-2025-11.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const nextStep = () => {
    if (counts.unresolved === 0 && totals.difference === 0)
      return { title: 'Ready to complete', detail: `All ${counts.all} exception records are explained and the remaining difference is $0.00.` }
    const suggestedPairs = cases.filter((c) => c.status === 'suggested').length
    const parts = [
      suggestedPairs ? `review ${suggestedPairs} suggested ${suggestedPairs === 1 ? 'match' : 'matches'}` : '',
      counts.unmatched ? `resolve ${counts.unmatched} unmatched ${counts.unmatched === 1 ? 'record' : 'records'}` : '',
    ].filter(Boolean)
    const detail = parts.length
      ? `${parts.join(', then ').replace(/^./, (c) => c.toUpperCase())}. ${counts.explained} of ${counts.all} explained.`
      : `All records are explained, but the remaining difference is ${money(totals.difference)}.`
    return { title: `${counts.unresolved} ${counts.unresolved === 1 ? 'record needs' : 'records need'} attention`, detail }
  }
  const step = nextStep()

  return (
    <main className={styles.page}>
      {/* Page heading (49:634) */}
      <div className={styles.heading}>
        <div className={styles.titleRow}>
          <h1 className="cf-text-page-title">Reconcile</h1>
          {completed ? (
            <span className={`${styles.badge} ${styles.badgeDone}`}>
              <Icon name="check" size={14} className={styles.badgeIcon} />
              Completed
            </span>
          ) : (
            <span className={styles.badge}>In progress</span>
          )}
        </div>
        <div className={styles.actions}>
          <SaveIndicator recon={recon} />
          <Button variant="ghost" onClick={() => setConfirmReset(true)}>
            Reset demo
          </Button>
          {completed ? (
            <>
              <Button variant="secondary" icon="download" onClick={download}>
                Download summary
              </Button>
              <Button variant="secondary" onClick={reopen}>
                Reopen reconciliation
              </Button>
            </>
          ) : (
            <Button
              variant="primary"
              aria-disabled={blockers.length > 0}
              aria-describedby={blockers.length ? 'completion-blockers' : undefined}
              onClick={complete}
            >
              Complete reconciliation
            </Button>
          )}
        </div>
      </div>

      {recon.saveStatus.kind === 'failed' && (
        <Notice
          tone="warning"
          role="alert"
          title="Your last change wasn't saved"
          action={
            <Button variant="secondary" onClick={recon.retrySave}>
              Try saving again
            </Button>
          }
        >
          The browser refused to store progress ({recon.saveStatus.error}). Your work is still on this page, but it will be lost if you
          refresh or close the tab.
        </Notice>
      )}

      {/* Account and period (49:640) */}
      <div className={styles.accountRow}>
        <Select
          label="Account"
          options={[{ value: ACCOUNT.id, label: ACCOUNT.name }]}
          value={ACCOUNT.id}
          onChange={() => {}}
          width={280}
          className={styles.contextSelect}
        />
        <Select
          label="Statement period"
          icon="calendar"
          options={[{ value: 'nov', label: PERIOD.label }]}
          value="nov"
          onChange={() => {}}
          width={300}
          className={styles.contextSelect}
        />
        <div className={styles.source}>
          <p className="cf-text-caption cf-text-secondary">Statement imported · {longDate(STATEMENT_IMPORTED)}</p>
          <p className={styles.opening}>
            Opening balance • Nov 1, 2025&nbsp;&nbsp;{money(OPENING_BALANCE)}
            <InfoTip topic="Opening balance">
              Bank balance at the start of Nov 1, 2025. Ledger cash opens at the same amount, so the period starts reconciled.
            </InfoTip>
          </p>
        </div>
      </div>

      {/* Key balances (49:656) */}
      <section aria-label="Balances" className={styles.balances}>
        <MetricCard variant="balance" label="Statement closing" value={money(totals.statementClosing)} info={DEFINITIONS.statement} />
        <MetricCard variant="balance" label="Book balance" value={money(totals.book)} info={DEFINITIONS.book} />
        <MetricCard variant="balance" label="Cleared balance" value={money(totals.cleared)} info={DEFINITIONS.cleared} />
        <MetricCard
          variant="balance"
          label="Remaining difference"
          value={money(totals.difference)}
          info={DEFINITIONS.difference}
          tone={totals.difference === 0 ? 'success' : 'default'}
        />
      </section>
      {/* Design addition (PRD 6): documented outstanding items below the cards. */}
      <p className={styles.adjustment} aria-label="Documented outstanding items">
        <span>Outstanding deposits <strong>{signed(totals.outstandingDeposits)}</strong></span>
        <span>Outstanding withdrawals <strong>{signed(totals.outstandingWithdrawals)}</strong></span>
        <span>Net adjustment <strong>{signed(totals.outstandingNet)}</strong></span>
        <span className="cf-text-secondary">Progress: {counts.explained} of {counts.all} exception records explained</span>
      </p>

      <div className={styles.workspace}>
        {completed ? (
          <>
            <Notice
              tone="success"
              size="page"
              title="November reconciliation completed"
              aside={`${state.completion.completedBy} · ${timestamp(state.completion.completedAt!)}`}
            >
              All {counts.all} exception records are explained: {counts.confirmed} confirmed, {counts.outstanding} outstanding. Reopen the
              reconciliation to make changes.
            </Notice>
            <CompletionSummary state={state} />
          </>
        ) : (
          <Notice tone="info" size="page" title={step.title}>
            {step.detail}
          </Notice>
        )}

        {!completed && blockersShown && blockers.length > 0 && (
          <Notice tone="warning" role="alert" title="The reconciliation can't be completed yet">
            <ul id="completion-blockers" className={styles.blockers}>
              {blockers.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </Notice>
        )}
        {!completed && !blockersShown && blockers.length > 0 && (
          <p id="completion-blockers" className="cf-visually-hidden">
            Complete reconciliation is unavailable: {blockers.join(' ')}
          </p>
        )}

        {pageError && (
          <Notice tone="warning" role="alert" title="That didn't work">
            {pageError}
          </Notice>
        )}

        {/* Transaction workspace (49:670) */}
        <section className={styles.transactions} aria-labelledby="transactions-title">
          <div className={styles.workspaceHeading}>
            <h2 id="transactions-title" className={styles.sectionTitle}>
              Exceptions to review
            </h2>
            <p className="cf-text-caption cf-text-secondary">
              {BANK_EXCEPTIONS.length} bank transactions / {LEDGER_EXCEPTIONS.length} ledger entries · {cases.length} review cases
              {state.generated.length > 0 && ` · ${state.generated.length} created ${state.generated.length === 1 ? 'entry' : 'entries'}`}
            </p>
          </div>
          <div className={styles.searchRow}>
            <label className={styles.searchField}>
              <span className="cf-visually-hidden">Search transactions or ledger entries</span>
              <Icon name="search" size={16} />
              <input
                type="search"
                value={query}
                placeholder="Search transactions or ledger entries"
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <Select
              aria-label="Status filter"
              width={160}
              options={[
                { value: 'all', label: 'All statuses' },
                { value: 'confirmed', label: 'Confirmed' },
                { value: 'suggested', label: 'Suggested' },
                { value: 'unmatched', label: 'Unmatched' },
                { value: 'outstanding', label: 'Outstanding' },
              ]}
              value={tab}
              onChange={(v) => setTab(v as TabValue)}
            />
          </div>
          <Tabs aria-label="Exception status" items={tabs} value={tab} onChange={(v) => setTab(v as TabValue)} divider className={styles.tabs} />
          <div className={styles.registerFooter}>
            <p className="cf-text-caption cf-text-secondary">
              Showing {visible.length} of {cases.length} review cases · counts are records ({counts.all} in total) · USD
            </p>
            <p className={styles.movement}>Net change in bank balance: {signed(totals.netBankMovement)}</p>
          </div>
          <div id="exceptions-register" role="tabpanel" aria-labelledby={`exceptions-register-tab`}>
            <Register
              recon={recon}
              cases={visible}
              expanded={expanded}
              onToggle={(key) => setExpanded((cur) => (cur === key ? null : key))}
              onCollapse={() => setExpanded(null)}
              announce={announce}
              lastUndoIds={lastUndo?.recordIds ?? []}
              onUndo={undo}
              emptyLabel={query ? `No review cases match “${query}”.` : `No ${tab === 'all' ? '' : tab} records.`}
            />
          </div>
        </section>

        <BackgroundPairs />

        <HistoryPanel state={state} onUndo={undo} />
      </div>

      <Modal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Reset the demo?"
        width={480}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmReset(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                recon.resetDemo()
                setConfirmReset(false)
                setExpanded(null)
                setTab('all')
                setQuery('')
                setBlockersShown(false)
                setPageError(null)
                announce('Demo reset to the original November data.')
              }}
            >
              Reset demo
            </Button>
          </>
        }
      >
        <p className="cf-text-body">
          This restores the original November data: 5 background pairs and 14 unexplained records. Your matches, created entries,
          evidence, notes, drafts and history will be cleared. This can't be undone.
        </p>
      </Modal>
    </main>
  )
}

function SaveIndicator({ recon }: { recon: Recon }) {
  const s = recon.saveStatus
  if (s.kind === 'failed') return <p className={styles.saveFailed}>Not saved</p>
  if (s.kind === 'saved') return <p className={styles.saved}>Saved in this browser · {timestamp(s.at)}</p>
  return <p className={styles.saved}>Progress saves in this browser</p>
}
