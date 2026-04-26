import { useEffect, useRef, useState } from "react";
import { useFetcher } from "react-router-dom";
import type { UpdateCommentAction } from "../../../../../../features/comment/action/update.action";
import { CheckIcon, XIcon } from "../../../../../../components/ui/Icons";

type UpdateCommentActionData = Awaited<ReturnType<typeof UpdateCommentAction>>;

function getContentError(data: UpdateCommentActionData | undefined) {
    if (!data || !("fieldErrors" in data)) return undefined;

    const fieldErrors = data.fieldErrors as
        | Partial<Record<"content", string[]>>
        | undefined;

    return fieldErrors?.content?.[0];
}

export function UpdateCommentSection({
    commentId,
    initialContent,
    onCancel,
    onSaved,
}: {
    commentId: string;
    initialContent: string;
    onCancel: () => void;
    onSaved: () => void;
}) {
    const fetcher = useFetcher<UpdateCommentActionData>();
    const wasSubmittingRef = useRef(false);
    const [content, setContent] = useState(initialContent);
    const contentError = getContentError(fetcher.data);
    const errorMessage =
        fetcher.data && "errorMessage" in fetcher.data
            ? fetcher.data.errorMessage
            : undefined;
    const isSubmitting = fetcher.state === "submitting";

    useEffect(() => {
        if (fetcher.state !== "idle") {
            wasSubmittingRef.current = true;
            return;
        }

        if (!wasSubmittingRef.current) return;

        wasSubmittingRef.current = false;
        if (fetcher.data !== null) return;
        onSaved();
    }, [fetcher.state, fetcher.data, onSaved]);

    return (
        <fetcher.Form
            method="post"
            action={`${commentId}/update`}
            className="space-y-3"
        >
            <textarea
                name="content"
                value={content}
                onChange={(event) => setContent(event.target.value)}
                rows={3}
                maxLength={100}
                aria-invalid={!!contentError}
                className={[
                    "w-full resize-none rounded-lg border bg-white px-3 py-2.5",
                    "text-sm leading-6 text-zinc-950 outline-none transition",
                    "focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100",
                    contentError ? "border-red-300" : "border-zinc-200",
                ].join(" ")}
            />

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-h-5">
                    {contentError && (
                        <p className="text-xs text-red-600">{contentError}</p>
                    )}

                    {errorMessage && (
                        <p className="text-xs text-red-600">{errorMessage}</p>
                    )}
                </div>

                <div className="flex shrink-0 items-center justify-between gap-2 sm:justify-end">
                    <span className="text-xs font-medium text-zinc-400">
                        {content.length}/100
                    </span>

                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 transition hover:bg-zinc-50 disabled:opacity-60"
                        aria-label="Cancel comment edit"
                        title="Cancel"
                    >
                        <XIcon className="h-4 w-4" />
                    </button>

                    <button
                        type="submit"
                        disabled={isSubmitting || content.trim().length === 0}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-950 text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
                        aria-label={isSubmitting ? "Saving comment" : "Save comment"}
                        title={isSubmitting ? "Saving..." : "Save"}
                    >
                        <CheckIcon className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </fetcher.Form>
    );
}
