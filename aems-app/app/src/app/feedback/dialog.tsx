import {
  ReadAllFeedbackDocument,
  ReadAllFeedbackQuery,
  ReadFeedbackFilesDocument,
  UpdateFeedbackDocument,
  User,
} from "@/generated/graphql-codegen/graphql";
import { Dialog, DialogFooter, DialogBody, IconName, Button, Divider, Intent, Tooltip } from "@blueprintjs/core";
import {
  feedbackStatusList,
  IStatusItem,
  SelectAssignee,
  SelectFeedbackStatus,
  unassignedUser,
} from "../components/feedback";
import styles from "./page.module.scss";
import { useMutation, useQuery } from "@apollo/client";
import { FilePreviews } from "../components/common/file";
import { useEffect, useMemo, useState } from "react";

interface IViewFeedbackProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  icon?: IconName;
  feedback: NonNullable<ReadAllFeedbackQuery["readAllFeedback"]>[0] | undefined;
}

export function ViewFeedback({ open, setOpen, icon, feedback }: IViewFeedbackProps) {
  const [status, setStatus] = useState<IStatusItem>(
    () => feedbackStatusList.find((item) => item.type === feedback?.status) || feedbackStatusList[0]
  );
  const [assignee, setAssignee] = useState<User>(feedback?.assignee ?? unassignedUser);

  const [updateFeedback, { loading }] = useMutation(UpdateFeedbackDocument, {
    refetchQueries: [ReadAllFeedbackDocument],
  });

  const { data: filesInfo } = useQuery(ReadFeedbackFilesDocument, {
    variables: {
      where: { feedbackId: { equals: feedback?.id } },
    },
  });

  const handleUpdate = () => {
    const newAssigneeId = assignee?.id === "unassigned" || !assignee ? null : assignee?.id;
    updateFeedback({
      variables: {
        where: {
          id: feedback?.id,
        },
        update: {
          ...(status.type !== feedback?.status && { status: status.type }),
          ...(assignee.id !== feedback?.assignee?.id && { assigneeId: newAssigneeId }),
        },
      },
    })
      .then(() => {
        setOpen(false);
      })
      .catch((error) => {
        console.error("Failed to update feedback status and assignee", error);
      });
  };

  const isFormDirty = useMemo(() => {
    const isStatusChanged = status.type !== feedback?.status;
    const isAssigneeChanged = feedback?.assignee?.id
      ? assignee?.id !== feedback?.assignee?.id
      : assignee?.id !== "unassigned";

    return isStatusChanged || isAssigneeChanged;
  }, [status.type, feedback?.status, assignee?.id, feedback?.assignee?.id]);

  useEffect(() => {
    setStatus(feedbackStatusList.find((item) => item.type === feedback?.status) || feedbackStatusList[0]);
    setAssignee(feedback?.assignee ?? unassignedUser);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Dialog className={styles.Dialog} title="Feedback" icon={icon} isOpen={open} onClose={() => setOpen(false)}>
      <DialogBody>
        {feedback && feedback.id ? (
          <div className={styles.panel}>
            <div className={styles.feedback}>
              <div className={styles.message}>
                <strong>Message:</strong>
                <span> {feedback.message} </span>
              </div>
              {filesInfo?.readFeedbackFiles && (feedback.files?.length ?? 0) > 0 && (
                <div>
                  <p>
                    <strong>Files:</strong>
                  </p>
                  <div className={styles.files}>
                    <FilePreviews files={filesInfo.readFeedbackFiles} />
                  </div>
                </div>
              )}
            </div>
            <Divider />
            <div className={styles.actions}>
              <div className={styles.field}>
                <strong>Sent by:</strong>
                <span>{feedback.user?.name}</span>
                <span> {feedback.user?.email}</span>
              </div>
              <div className={styles.field}>
                <strong>Status:</strong>
                <SelectFeedbackStatus status={status} setStatus={setStatus} />
              </div>
              <div className={styles.field}>
                <strong>Assignee:</strong>
                <SelectAssignee assignee={assignee} setAssignee={setAssignee} />
              </div>
              <div className={styles.time}>
                <span>
                  Last updated on{" "}
                  {feedback.updatedAt
                    ? new Date(feedback.updatedAt)?.toLocaleString(process.env.NEXT_PUBLIC_LOCALE)
                    : "unknown"}
                </span>
                <span>
                  Created on{" "}
                  {feedback.createdAt
                    ? new Date(feedback.createdAt)?.toLocaleString(process.env.NEXT_PUBLIC_LOCALE)
                    : "unknown"}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <p>No feedback selected</p>
        )}
      </DialogBody>
      <DialogFooter>
        <div className={styles.footer}>
          <Button onClick={() => setOpen(false)}>Close</Button>
          <Tooltip
            content={<span>Change status or assignee to update this feedback</span>}
            openOnTargetFocus={false}
            placement="top"
            disabled={loading || isFormDirty}
          >
            <Button intent={Intent.PRIMARY} disabled={!isFormDirty} onClick={() => handleUpdate()}>
              Update
            </Button>
          </Tooltip>
        </div>
      </DialogFooter>
    </Dialog>
  );
}
