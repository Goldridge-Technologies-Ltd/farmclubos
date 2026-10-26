import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@farmclub/design-system/Badge";
import { Button } from "@farmclub/design-system/Button";
import { ButtonLink } from "@farmclub/design-system/ButtonLink";
import { EmptyState } from "@farmclub/design-system/EmptyState";
import { Icon } from "@farmclub/design-system/Icon";
import { Notice } from "@farmclub/design-system/Notice";
import { fieldClass } from "@farmclub/design-system/form-classes";
import { PageHeader } from "@/components/layout/PageHeader";
import { platformContent } from "@/content/platform";
import { listInstitutions } from "@/lib/api/platform";
import { formatDay } from "@/lib/format";

export const metadata: Metadata = { title: "Institutions" };

type PageProps = { searchParams: Promise<{ search?: string }> };

/*
  Every institution on the platform, by name.

  One page of them, with a search: Phase 1 has a handful, and a screen that
  admits "showing 100 of 240" is honest where one that silently stops at the
  first page is not. The search is a plain GET form, so it works before the
  page's JavaScript has loaded and leaves a URL that can be shared.
*/
export default async function InstitutionsPage({ searchParams }: PageProps) {
  const search = ((await searchParams).search ?? "").trim();
  const { items: institutions, pagination } = await listInstitutions(search || undefined);
  const copy = platformContent.list;

  const add = (
    <ButtonLink href="/platform/institutions/new" icon="none" size="md">
      {copy.add}
    </ButtonLink>
  );

  return (
    <div className="app-stack">
      <PageHeader
        actions={institutions.length > 0 || search ? add : undefined}
        crumbs={[{ label: platformContent.crumb }, { label: copy.heading }]}
        description={copy.description}
        eyebrow={copy.eyebrow}
        heading={copy.heading}
      />

      {institutions.length === 0 && !search ? (
        <EmptyState
          action={add}
          description={copy.empty.description}
          icon="governance"
          title={copy.empty.title}
        />
      ) : (
        <>
          <form action="/platform/institutions" className="flex flex-wrap items-end gap-3" role="search">
            <label className="grid min-w-0 flex-1 gap-1.5 sm:max-w-sm">
              <span className="text-xs font-semibold text-farm-green-950">{copy.search}</span>
              <input className={fieldClass} defaultValue={search} name="search" type="search" />
            </label>
            <Button icon="none" type="submit" variant="secondary">
              {copy.searchSubmit}
            </Button>
            {search ? (
              <Link
                className="self-center text-sm font-semibold text-farm-green-800 transition-colors hover:text-farm-green-950"
                href="/platform/institutions"
              >
                {copy.clearSearch}
              </Link>
            ) : null}
          </form>

          {pagination.totalItems > institutions.length ? (
            <Notice tone="info">{copy.showing(institutions.length, pagination.totalItems)}</Notice>
          ) : null}

          {institutions.length === 0 ? (
            <p className="type-body-sm text-farm-muted">{copy.noMatches(search)}</p>
          ) : (
            <ul className="grid gap-3">
              {institutions.map((institution) => (
                <li key={institution.id}>
                  <Link
                    href={`/platform/institutions/${institution.id}`}
                    className="group flex flex-wrap items-start justify-between gap-4 rounded-panel border border-farm-border bg-white p-6 transition-colors hover:border-farm-border-strong"
                  >
                    <div className="min-w-0 flex-1">
                      <h2 className="text-lg font-semibold text-farm-green-950">{institution.name}</h2>
                      <p className="mt-1 type-caption text-farm-muted">
                        {platformContent.types[institution.type]} · {institution.contactEmail} ·{" "}
                        {copy.added(formatDay(institution.createdAt))}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-3">
                      {institution.kind === "INDEPENDENT_LEARNERS" ? (
                        <Badge tone="info">{platformContent.independentLearners.badge}</Badge>
                      ) : null}
                      <Badge tone={institution.status === "ACTIVE" ? "success" : "warning"}>
                        {platformContent.statuses[institution.status]}
                      </Badge>
                      <Icon
                        name="chevron-right"
                        size={16}
                        className="text-farm-muted transition-transform group-hover:translate-x-1"
                      />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
