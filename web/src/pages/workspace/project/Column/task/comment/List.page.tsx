import { useMemo, useState } from "react";
import { useLoaderData, useRouteLoaderData } from "react-router-dom";
import type { SafeCommentsType } from "../../../../../../../../api/src/modules/comment/comment.schemas";
import { useAuth } from "../../../../../../features/auth/auth.store";
import type { ActionError } from "../../../../../../features/type";
import type { GetByIdLoader } from "../../../../../../features/workspace/loader/getById";
import { CreateCommentSection } from "./Create.section";
import { DetailCommentSection } from "./Detail.section";
import { ReplySection } from "./Reply.section";
import { UpdateCommentSection } from "./Update.section";

type LoaderData = SafeCommentsType | ActionError | undefined;
type CommentItem = SafeCommentsType["data"][number];

function isCommentListData(data: LoaderData): data is SafeCommentsType {
    return (
        !!data &&
        typeof data === "object" &&
        "data" in data &&
        Array.isArray(data.data)
    );
}

function hasErrorMessage(data: unknown): data is { errorMessage: string } {
    return (
        !!data &&
        typeof data === "object" &&
        "errorMessage" in data &&
        typeof (data as { errorMessage?: unknown }).errorMessage === "string"
    );
}

function sortByCreatedAt(comments: CommentItem[]) {
    return [...comments].sort(
        (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
}

export function ListCommentPage() {
    const data = useLoaderData() as LoaderData;
    const workspaceData = useRouteLoaderData<typeof GetByIdLoader>("workspace-detail");
    const auth = useAuth();
    const [replyingToId, setReplyingToId] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const role =
        workspaceData &&
        !("errorMessage" in workspaceData) &&
        !("formErrors" in workspaceData) &&
        !("fieldErrors" in workspaceData)
            ? workspaceData.myMembership.role
            : undefined;
    const canComment = role === "owner" || role === "admin" || role === "member";

    const { rootComments, repliesByParentId } = useMemo(() => {
        const empty = {
            rootComments: [] as CommentItem[],
            repliesByParentId: new Map<string, CommentItem[]>(),
        };

        if (!isCommentListData(data)) return empty;

        const replies = new Map<string, CommentItem[]>();
        const roots: CommentItem[] = [];

        for (const comment of sortByCreatedAt(data.data)) {
            if (!comment.parentId) {
                roots.push(comment);
                continue;
            }

            const existingReplies = replies.get(comment.parentId) ?? [];
            existingReplies.push(comment);
            replies.set(comment.parentId, existingReplies);
        }

        return {
            rootComments: roots,
            repliesByParentId: replies,
        };
    }, [data]);

    if (!isCommentListData(data)) {
        const message = hasErrorMessage(data)
            ? data.errorMessage
            : "Something went wrong while loading comments.";

        return (
            <section className="rounded-lg border border-red-100 bg-red-50 p-6 shadow-sm">
                <p className="text-sm font-semibold text-red-700">
                    Failed to load comments
                </p>

                <p className="mt-2 text-sm text-red-600">{message}</p>
            </section>
        );
    }

    const totalComments = data.paginationMeta.totalItems;

    return (
        <main className="space-y-5">
            {canComment ? (
                <CreateCommentSection />
            ) : (
                <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
                    <h2 className="text-base font-semibold text-zinc-950">
                        Comments
                    </h2>

                    <p className="mt-1 text-sm text-zinc-500">
                        You can read this discussion, but your workspace role cannot add comments.
                    </p>
                </section>
            )}

            <section className="space-y-4">
                <div className="flex flex-col gap-2 border-b border-zinc-200 pb-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h2 className="text-base font-semibold text-zinc-950">
                            Discussion
                        </h2>

                        <p className="mt-1 text-sm text-zinc-500">
                            {totalComments} comment{totalComments !== 1 ? "s" : ""} on this task
                        </p>
                    </div>

                    <span className="inline-flex w-fit items-center rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-500">
                        {rootComments.length} thread{rootComments.length !== 1 ? "s" : ""}
                    </span>
                </div>

                {data.data.length === 0 ? (
                    <div className="flex min-h-40 items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-white/80 p-8 text-center">
                        <div>
                            <h3 className="text-base font-semibold text-zinc-950">
                                No comments yet
                            </h3>

                            <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-500">
                                Start the discussion with a short note or question.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {rootComments.map((comment) => {
                            const replies = repliesByParentId.get(comment.id) ?? [];
                            const canEdit = auth.user?.id === comment.authorId;
                            const isEditing = editingId === comment.id;

                            return (
                                <div key={comment.id} className="space-y-3">
                                    <DetailCommentSection
                                        comment={comment}
                                        canEdit={canEdit}
                                        canReply={canComment}
                                        isEditing={isEditing}
                                        onEdit={() => {
                                            setEditingId(comment.id);
                                            setReplyingToId(null);
                                        }}
                                        onReply={() => {
                                            setReplyingToId(comment.id);
                                            setEditingId(null);
                                        }}
                                    >
                                        {isEditing ? (
                                            <UpdateCommentSection
                                                commentId={comment.id}
                                                initialContent={comment.content}
                                                onCancel={() => setEditingId(null)}
                                                onSaved={() => setEditingId(null)}
                                            />
                                        ) : undefined}
                                    </DetailCommentSection>

                                    {replyingToId === comment.id && (
                                        <ReplySection
                                            commentId={comment.id}
                                            onCancel={() => setReplyingToId(null)}
                                            onPosted={() => setReplyingToId(null)}
                                        />
                                    )}

                                    {replies.length > 0 && (
                                        <div className="ml-6 space-y-3 border-l border-zinc-200 pl-4 sm:ml-12">
                                            {replies.map((reply) => {
                                                const canEditReply =
                                                    auth.user?.id === reply.authorId;
                                                const isEditingReply =
                                                    editingId === reply.id;

                                                return (
                                                    <DetailCommentSection
                                                        key={reply.id}
                                                        comment={reply}
                                                        isReply
                                                        canEdit={canEditReply}
                                                        canReply={canComment}
                                                        isEditing={isEditingReply}
                                                        onEdit={() => {
                                                            setEditingId(reply.id);
                                                            setReplyingToId(null);
                                                        }}
                                                        onReply={() => {
                                                            setReplyingToId(comment.id);
                                                            setEditingId(null);
                                                        }}
                                                    >
                                                        {isEditingReply ? (
                                                            <UpdateCommentSection
                                                                commentId={reply.id}
                                                                initialContent={reply.content}
                                                                onCancel={() => setEditingId(null)}
                                                                onSaved={() => setEditingId(null)}
                                                            />
                                                        ) : undefined}
                                                    </DetailCommentSection>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>
        </main>
    );
}
