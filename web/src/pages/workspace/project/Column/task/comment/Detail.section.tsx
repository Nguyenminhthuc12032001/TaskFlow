import type { ReactNode } from "react";
import type { SafeCommentType } from "../../../../../../../../api/src/modules/comment/comment.schemas";
import { EditIcon } from "../../../../../../components/ui/Icons";

function formatDate(value: Date | string) {
    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(value));
}

function getInitials(value: string) {
    const initials = value
        .split(/\s+/)
        .filter(Boolean)
        .map((part) => part.charAt(0))
        .join("");

    return (initials || "U").slice(0, 2).toUpperCase();
}

export function DetailCommentSection({
    comment,
    isReply,
    canEdit,
    canReply,
    isEditing,
    children,
    onEdit,
    onReply,
}: {
    comment: SafeCommentType;
    isReply?: boolean;
    canEdit: boolean;
    canReply: boolean;
    isEditing: boolean;
    children?: ReactNode;
    onEdit: () => void;
    onReply: () => void;
}) {
    const authorLabel = `User ${comment.authorId.slice(0, 8)}`;
    const isEdited =
        new Date(comment.updatedAt).getTime() !==
        new Date(comment.createdAt).getTime();

    return (
        <section
            className={[
                "rounded-lg border border-zinc-200 p-4",
                isReply ? "bg-zinc-50/80 shadow-none" : "bg-white shadow-sm",
            ].join(" ")}
        >
            <div className="flex gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-950 text-xs font-semibold text-white ring-4 ring-zinc-100">
                    {getInitials(authorLabel)}
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-zinc-950">
                                {authorLabel}
                            </p>

                            <p className="mt-1 text-xs text-zinc-400">
                                {formatDate(comment.createdAt)}
                                {isEdited ? " | edited" : ""}
                            </p>
                        </div>

                        {!isEditing && (
                            <div className="flex shrink-0 items-center gap-2">
                                {canReply && (
                                    <button
                                        type="button"
                                        onClick={onReply}
                                        className="inline-flex h-8 items-center rounded-lg border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-600 transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-950"
                                    >
                                        Reply
                                    </button>
                                )}

                                {canEdit && (
                                    <button
                                        type="button"
                                        onClick={onEdit}
                                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-950 text-white transition hover:bg-zinc-800"
                                        aria-label="Edit comment"
                                        title="Edit comment"
                                    >
                                        <EditIcon className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="mt-3">
                        {children ?? (
                            <p className="whitespace-pre-wrap break-words text-sm leading-6 text-zinc-700">
                                {comment.content}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
