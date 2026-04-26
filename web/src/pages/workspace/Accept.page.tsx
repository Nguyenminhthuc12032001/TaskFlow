import { Form, useActionData, useNavigation, useSearchParams } from "react-router-dom";
import type { ActionError } from "../../features/type";

export function AcceptInvitePage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const navigation = useNavigation();
  const actionError: ActionError | undefined = useActionData();

  const isSubmitting = navigation.state === "submitting";

  const tokenError = actionError?.fieldErrors?.token?.[0];
  const formError = actionError?.formErrors?.[0];
  const errorMessage = actionError?.errorMessage;
  const missingToken = !token;

  return (
    <section className="min-h-full bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-xl">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-6 sm:px-8">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-lg font-semibold text-white shadow-sm">
              TF
            </div>

            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Accept invitation
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              This invite can only be accepted by the account it was sent to.
            </p>
          </div>

          <div className="px-6 py-6 sm:px-8 sm:py-8">
            {missingToken ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
                This invitation link is missing a token. Please open the full invite link from your email.
              </div>
            ) : (
              <>
                {(errorMessage || formError) && (
                  <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
                    {errorMessage || formError}
                  </div>
                )}

                <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-sm font-semibold text-slate-800">
                    Invitation link ready
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Confirm to join the workspace with the role selected by the inviter.
                  </p>
                </div>

                <Form method="post" className="space-y-5">
                  <input type="hidden" name="token" value={token} />

                  {tokenError && (
                    <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                      {tokenError}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting ? "Accepting..." : "Accept invitation"}
                  </button>
                </Form>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
