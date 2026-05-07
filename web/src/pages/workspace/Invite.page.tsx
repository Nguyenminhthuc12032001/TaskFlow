import type { FormEvent } from "react";
import {
  Form,
  Link,
  useActionData,
  useLoaderData,
  useNavigation,
  useSearchParams,
} from "react-router-dom";
import type { ActionError } from "../../features/type";
import { InviteCandidatesLoader } from "../../features/workspace/loader/inviteCandidates";
import { WorkspaceRole } from "../../../../api/prisma/generated/enums";
import { getQueryLink } from "../../app/shared/lib/query";
import { XIcon } from "../../components/ui/Icons";

const roleOptions = [
  {
    value: WorkspaceRole.admin,
    label: "Admin",
    hint: "Can manage projects, columns, tasks, and members.",
  },
  {
    value: WorkspaceRole.member,
    label: "Member",
    hint: "Can collaborate on day-to-day workspace work.",
  },
  {
    value: WorkspaceRole.viewer,
    label: "Viewer",
    hint: "Can view workspace content with limited access.",
  },
];

const defaultPageSizeOptions = [6, 10, 20, 50, 100];

function getPageSizeOptions(currentLimit: number) {
  return Array.from(new Set([...defaultPageSizeOptions, currentLimit])).sort((a, b) => a - b);
}

export function InvitePage() {
  const data = useLoaderData<typeof InviteCandidatesLoader>();
  const actionError: ActionError | undefined = useActionData();
  const navigation = useNavigation();
  const [searchParams, setSearchParams] = useSearchParams();

  const isSubmitting = navigation.state === "submitting";
  const isLoadError = "errorMessage" in data;
  const users = isLoadError ? [] : data.data;
  const pagination = isLoadError ? null : data.paginationMeta;
  const query = searchParams.get("search")?.trim() ?? "";
  const startDate = searchParams.get("startDate") ?? "";
  const endDate = searchParams.get("endDate") ?? "";
  const pageSizeOptions = pagination ? getPageSizeOptions(pagination.limit) : defaultPageSizeOptions;
  const hasFilters = Boolean(query || startDate || endDate);
  const filterKey = [query, startDate, endDate, pagination?.limit ?? ""].join("|");

  const userIdError = actionError?.fieldErrors?.userId?.[0];
  const roleError = actionError?.fieldErrors?.role?.[0];
  const formError = actionError?.formErrors?.[0];
  const errorMessage = actionError?.errorMessage;
  const hasInviteCandidates = users.length > 0;
  const availableCount = pagination?.totalItems ?? users.length;

  function handleFilterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!pagination) return;

    const formData = new FormData(event.currentTarget);
    const nextSearch = formData.get("search")?.toString().trim() ?? "";
    const nextStartDate = formData.get("startDate")?.toString() ?? "";
    const nextEndDate = formData.get("endDate")?.toString() ?? "";
    const nextLimit = formData.get("limit")?.toString() ?? String(pagination.limit);
    const params = new URLSearchParams(searchParams);

    [
      ["search", nextSearch],
      ["startDate", nextStartDate],
      ["endDate", nextEndDate],
      ["limit", nextLimit],
    ].forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    params.set("page", "1");
    setSearchParams(params);
  }

  function handleClearFilters() {
    const params = new URLSearchParams(searchParams);

    params.delete("search");
    params.delete("startDate");
    params.delete("endDate");
    params.set("page", "1");
    setSearchParams(params);
  }

  function getPageLink(page: number) {
    return getQueryLink(searchParams, { page, limit: pagination?.limit ?? 10 });
  }

  return (
    <section className="min-h-full bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-6 sm:flex-row sm:items-start sm:justify-between sm:px-8">
            <div>
              <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                Member invitation
              </span>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
                Invite a user
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
                Choose an eligible account and assign the right level of access.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Available
              </p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {availableCount}
              </p>
            </div>
          </div>

          {!isLoadError ? (
            <div className="border-b border-slate-100 px-6 py-5 sm:px-8">
              <form
                key={filterKey}
                onSubmit={handleFilterSubmit}
                className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(180px,1fr)_150px_150px_110px_auto]"
              >
                <label className="min-w-0">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Search
                  </span>
                  <input
                    name="search"
                    defaultValue={query}
                    placeholder="Name or email"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                  />
                </label>

                <label>
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                    From
                  </span>
                  <input
                    type="date"
                    name="startDate"
                    defaultValue={startDate}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                  />
                </label>

                <label>
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                    To
                  </span>
                  <input
                    type="date"
                    name="endDate"
                    defaultValue={endDate}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                  />
                </label>

                <label>
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Per page
                  </span>
                  <select
                    name="limit"
                    defaultValue={String(pagination?.limit ?? 10)}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                  >
                    {pageSizeOptions.map((limit) => (
                      <option key={limit} value={limit}>
                        {limit}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="flex items-end gap-2">
                  <button
                    type="submit"
                    className="inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800 lg:flex-none"
                  >
                    Apply
                  </button>

                  {hasFilters ? (
                    <button
                      type="button"
                      onClick={handleClearFilters}
                      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                      aria-label="Clear filters"
                      title="Clear filters"
                    >
                      <XIcon className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              </form>
            </div>
          ) : null}

          <div className="px-6 py-6 sm:px-8">
            {isLoadError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {data.errorMessage}
              </div>
            ) : (
              <Form method="post" className="space-y-7" noValidate>
                {(formError || errorMessage) && (
                  <div
                    role="alert"
                    aria-live="polite"
                    className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                  >
                    {formError || errorMessage}
                  </div>
                )}

                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                  <label
                    htmlFor="userId"
                    className="block text-sm font-semibold text-slate-900"
                  >
                    User
                  </label>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Existing members and pending invitees are hidden.
                  </p>

                  <select
                    name="userId"
                    id="userId"
                    required
                    disabled={!hasInviteCandidates}
                    aria-invalid={!!userIdError}
                    aria-describedby={userIdError ? "invitee-error" : undefined}
                    className={[
                      "mt-3 block h-12 w-full rounded-lg border bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition",
                      userIdError
                        ? "border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-100"
                        : "border-slate-200 focus:border-slate-400 focus:ring-4 focus:ring-slate-200/70",
                      !hasInviteCandidates ? "cursor-not-allowed text-slate-400" : "",
                    ].join(" ")}
                  >
                    {hasInviteCandidates ? (
                      users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name} - {user.email}
                        </option>
                      ))
                    ) : (
                      <option value="">
                        {hasFilters ? "No eligible users match filters" : "No eligible users"}
                      </option>
                    )}
                  </select>

                  {userIdError && (
                    <p
                      id="invitee-error"
                      className="mt-2 text-sm text-red-600"
                      role="alert"
                    >
                      {userIdError}
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Member role
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Choose the least access they need for their work.
                  </p>

                  <div
                    className="mt-3 grid gap-3 sm:grid-cols-3"
                    aria-describedby={roleError ? "role-error" : undefined}
                  >
                    {roleOptions.map((role) => (
                      <label
                        key={role.value}
                        className="group cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 has-checked:border-slate-900 has-checked:bg-slate-900 has-checked:text-white"
                      >
                        <input
                          type="radio"
                          name="role"
                          value={role.value}
                          defaultChecked={role.value === WorkspaceRole.member}
                          className="sr-only"
                          aria-invalid={!!roleError}
                        />
                        <span className="flex items-center justify-between gap-3">
                          <span className="text-sm font-semibold">
                            {role.label}
                          </span>
                          <span className="h-2.5 w-2.5 rounded-full border border-slate-300 bg-white group-has-checked:border-white group-has-checked:bg-white" />
                        </span>
                        <span className="mt-2 block text-xs leading-5 text-slate-500 group-has-checked:text-slate-200">
                          {role.hint}
                        </span>
                      </label>
                    ))}
                  </div>

                  <div className="mt-2 min-h-5">
                    {roleError && (
                      <p
                        id="role-error"
                        className="text-sm text-red-600"
                        role="alert"
                      >
                        {roleError}
                      </p>
                    )}
                  </div>
                </div>

                {pagination && pagination.totalPages > 1 ? (
                  <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm text-slate-600">
                      Page <span className="font-semibold text-slate-900">{pagination.page}</span>
                      {" / "}
                      <span className="font-semibold text-slate-900">{pagination.totalPages}</span>
                      {" - "}
                      Total <span className="font-semibold text-slate-900">{pagination.totalItems}</span> users
                    </div>

                    <div className="flex items-center gap-3">
                      {pagination.hasPrevPage ? (
                        <Link
                          to={getPageLink(pagination.page - 1)}
                          className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                          Previous
                        </Link>
                      ) : (
                        <span className="inline-flex h-10 cursor-not-allowed items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-400 opacity-50">
                          Previous
                        </span>
                      )}

                      {pagination.hasNextPage ? (
                        <Link
                          to={getPageLink(pagination.page + 1)}
                          className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                          Next
                        </Link>
                      ) : (
                        <span className="inline-flex h-10 cursor-not-allowed items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-400 opacity-50">
                          Next
                        </span>
                      )}
                    </div>
                  </div>
                ) : null}

                <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-end">
                  <Link
                    to=".."
                    relative="path"
                    className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Back
                  </Link>

                  <button
                    type="submit"
                    disabled={isSubmitting || !hasInviteCandidates}
                    className="inline-flex h-11 items-center justify-center rounded-lg bg-slate-900 px-5 text-sm font-medium text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting ? "Sending..." : "Send invitation"}
                  </button>
                </div>
              </Form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
