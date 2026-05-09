import { useState } from "react";
import { useFetcher } from "react-router-dom";
import type { CreateCommentAction } from "../../../../../../features/comment/action/create.action";
import { MessageCircleIcon } from "../../../../../../components/ui/Icons";

type CreateCommentActionData = Awaited<ReturnType<typeof CreateCommentAction>>;

function getContentError(data: CreateCommentActionData | undefined) {
    if (!data || !("fieldErrors" in data)) return undefined;

    const fieldErrors = data.fieldErrors as
        | Partial<Record<"content", string[]>>
        | undefined;

    return fieldErrors?.content?.[0];
}

export function CreateCommentSection() {
    const fetcher = useFetcher<CreateCommentActionData>();
    const resetKey = fetcher.data?.resetKey ?? "initial";

    return (
        <CreateCommentForm
            key={resetKey}
            fetcher={fetcher}
            resetKey={resetKey}
        />
    );
}


function CreateCommentForm({
    fetcher,
    resetKey,
}: {
    fetcher: ReturnType<typeof useFetcher<CreateCommentActionData>>;
    resetKey: string;
}) {
    const [content, setContent] = useState("");
    const contentError = getContentError(fetcher.data);
    const errorMessage =
        fetcher.data && "errorMessage" in fetcher.data
            ? fetcher.data.errorMessage
            : undefined;
    const isSubmitting = fetcher.state === "submitting";

    return (
        <section className="rounded-lg border border-zinc-200/80 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 border-b border-zinc-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-center gap-3">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-950 text-white">
                        <MessageCircleIcon className="h-4 w-4" />
                    </span>

                    <div>
                        <h2 className="text-base font-semibold text-zinc-950">
                            New comment
                        </h2>
                        <p className="mt-1 text-sm text-zinc-500">
                            Share a clear update for this task.
                        </p>
                    </div>
                </div>

                <span className="inline-flex h-7 w-fit items-center rounded-full bg-zinc-100 px-2.5 text-xs font-medium text-zinc-500">
                    {content.length}/100
                </span>
            </div>

            <fetcher.Form method="post" action="create" className="space-y-3">
                <input type="hidden" name="resetKey" value={resetKey} />
                <div>
                    <label htmlFor="comment-content" className="sr-only">
                        New comment
                    </label>

                    <textarea
                        id="comment-content"
                        name="content"
                        value={content}
                        onChange={(event) => setContent(event.target.value)}
                        rows={3}
                        maxLength={100}
                        placeholder="Write a short comment"
                        aria-invalid={!!contentError}
                        className={[
                            "min-h-24 w-full resize-none rounded-lg border bg-white px-4 py-3",
                            "text-sm leading-6 text-zinc-950 outline-none transition",
                            "placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100",
                            contentError ? "border-red-300" : "border-zinc-200",
                        ].join(" ")}
                    />

                    {(contentError || errorMessage) && (
                        <div className="mt-2 space-y-1">
                            {contentError && (
                                <p className="text-sm text-red-600">{contentError}</p>
                            )}

                            {errorMessage && (
                                <p className="text-sm text-red-600">{errorMessage}</p>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={isSubmitting || content.trim().length === 0}
                        className="inline-flex h-10 items-center justify-center rounded-lg bg-zinc-950 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
                    >
                        {isSubmitting ? "Posting..." : "Post comment"}
                    </button>
                </div>
            </fetcher.Form>
        </section>
    );
}
