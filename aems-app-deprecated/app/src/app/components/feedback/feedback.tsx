import { Dispatch, SetStateAction, useContext, useState } from "react";
import { Button, Card, Elevation, TextArea, FormGroup, Tooltip, Intent, MenuItem } from "@blueprintjs/core";
import { Camera, Document, IconNames, SmallCross, Upload } from "@blueprintjs/icons";
import styles from "./feedback.module.scss";
import html2canvas from "html2canvas";
import {
  CreateFeedbackDocument,
  FeedbackStatusType as FeedbackStatusTypeGql,
  ReadUsersDocument,
  User,
} from "@/generated/graphql-codegen/graphql";
import { FeedbackStatus, RoleType } from "@/common";

import { useMutation, useQuery } from "@apollo/client";
import { CurrentContext, NotificationContext, NotificationType } from "../providers";
import { ItemRenderer, Select } from "@blueprintjs/select";

export interface IStatusItem {
  label: string;
  type: FeedbackStatusTypeGql;
}

export const feedbackStatusList: IStatusItem[] = FeedbackStatus.values.map((status) => ({
  label: status.label,
  type: FeedbackStatusTypeGql[status.enum],
}));

interface IFeedbackFormProps {
  onClose: () => void;
}

async function uploadFiles(files: File[]) {
  const formData = new FormData();

  for (const file of files) {
    formData.append("files", file);
  }

  const response = await fetch("/api/file/upload", {
    method: "POST",
    body: formData,
  });

  const result = await response.json();

  if (!result.ids || !Array.isArray(result.ids)) {
    throw new Error("The 'ids' field is missing or is not an array in the response.");
  }

  return result.ids.map((fileId: string) => ({ id: fileId }));
}

export function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  const { current } = useContext(CurrentContext);
  const isUser = RoleType.User.granted(...(current?.role?.split(" ") ?? []));

  const toggleFeedbackForm = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <>
      {isOpen && <FeedbackForm onClose={toggleFeedbackForm} />}
      {!isHidden && isUser && (
        <div className={styles.widgetContainer}>
          <Button aria-label="send feedback" onClick={toggleFeedbackForm}>
            Send feedback
          </Button>
          <Button
            icon={IconNames.CROSS}
            onClick={() => {
              setIsHidden(true);
            }}
            minimal
          />
        </div>
      )}
    </>
  );
}

export function FeedbackForm({ onClose }: IFeedbackFormProps) {
  const [message, setMessage] = useState<string>("");
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { createNotification } = useContext(NotificationContext);

  const [createFeedback, _feedback] = useMutation(CreateFeedbackDocument);

  function handleMessageChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { value } = e.target;
    setMessage(value);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      setFiles((prevFiles) => [...prevFiles, ...Array.from(selectedFiles)]);
    }
  }

  function handleRemoveFile(index: number) {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
  }

  function handleError() {
    createNotification?.("There was an error submitting your feedback, please try again", NotificationType.Error);
    setIsSubmitting(false);
  }

  function handleCompleted() {
    createNotification?.("Feedback submitted", NotificationType.Notification);
    setIsSubmitting(false);
    onClose();
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);

    let filesToConnect;

    if (files.length > 0) {
      filesToConnect = await uploadFiles(files);
    }

    await createFeedback({
      variables: {
        create: {
          message: message,
          files: { connect: filesToConnect },
        },
      },
      onError: handleError,
      onCompleted: handleCompleted,
    });
  }

  function captureScreen() {
    const options = {
      ignoreElements: (element: Element) => {
        return element.id === "feedback-form-card";
      },
    };

    // Supported CSS properties and values: https://html2canvas.hertzen.com/features
    html2canvas(document.body, options).then(function (canvas) {
      canvas.toBlob((blob) => {
        if (blob) {
          const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
          const screenshotFile = new File([blob], `screenshot-${timestamp}.png`, { type: "image/png" });
          setFiles((prevFiles) => [...prevFiles, screenshotFile]);
        }
      });

      // Create and display the white overlay element (Flash FX) after capturing the screenshot
      const overlay = document.createElement("div");
      overlay.style.position = "fixed";
      overlay.style.top = "0";
      overlay.style.left = "0";
      overlay.style.width = "100%";
      overlay.style.height = "100%";
      overlay.style.backgroundColor = "white";
      overlay.style.zIndex = "9999";
      overlay.style.opacity = "0.8";
      overlay.style.transition = "opacity 0.1s"; // Smooth transition for flash effect

      // Append the overlay to the body
      document.body.appendChild(overlay);

      // Remove the overlay after the flash fx duration
      setTimeout(() => {
        document.body.removeChild(overlay);
      }, 100);
    });
  }

  return (
    <Card id="feedback-form-card" interactive={true} elevation={Elevation.ONE} className={styles.feedbackModal}>
      <form aria-label="feedback form" onSubmit={handleSubmit} className={styles.feedbackForm}>
        <div className={styles.header}>
          <h2 className="bp5-heading">Help us improve</h2>
          <div className={styles.buttonWrapper}>
            <Button disabled={isSubmitting} minimal onClick={() => onClose()} icon={<SmallCross size={20} />} />
          </div>
        </div>
        <div className={styles.body}>
          <FormGroup label="Message" labelInfo="(required)">
            <TextArea
              asyncControl
              fill
              placeholder="Please enter any feedback here"
              value={message}
              onChange={handleMessageChange}
              className={styles.messageField}
            />
          </FormGroup>
          <FormGroup label="Files" labelInfo="(optional)">
            <div className={styles.fileUploadContainer}>
              {files.length === 0 && <div className={styles.fileUploadPlaceholderText}>No files uploaded</div>}
              <ul className={styles.fileList}>
                {files.map((file, index) => (
                  <div key={index} className={styles.fileItem}>
                    <li key={index} className={styles.fileHeader}>
                      <Document size={16} />
                      <div className="bp5-text-overflow-ellipsis">{file.name}</div>
                    </li>
                    <Button
                      minimal
                      type="button"
                      onClick={() => handleRemoveFile(index)}
                      icon={<SmallCross size={14} />}
                    />
                  </div>
                ))}
              </ul>
            </div>
            <div className={styles.fileUploadButton}>
              <Button onClick={captureScreen} icon={<Camera size={14} />}>
                Capture current screen
              </Button>
              <Button icon={<Upload size={14} />}>
                <label htmlFor="upload-file">Upload files</label>
              </Button>
              <input id="upload-file" type="file" multiple onChange={handleFileChange} style={{ display: "none" }} />
            </div>
          </FormGroup>
        </div>
        <div className={styles.footer}>
          <Tooltip
            content={<span>Please enter a message to submit feedback</span>}
            openOnTargetFocus={false}
            placement="top"
            disabled={isSubmitting || !!message}
          >
            <Button loading={isSubmitting} type="submit" disabled={isSubmitting || !message} intent={Intent.PRIMARY}>
              Submit
            </Button>
          </Tooltip>
        </div>
      </form>
    </Card>
  );
}

export function SelectFeedbackStatus({
  status,
  setStatus,
}: {
  status: IStatusItem;
  setStatus: Dispatch<SetStateAction<IStatusItem>>;
}) {
  const handleChange = (newStatus: IStatusItem) => {
    setStatus(newStatus);
  };

  const renderStatus: ItemRenderer<IStatusItem> = (statusItem, { handleClick, handleFocus, modifiers }) => {
    if (!modifiers.matchesPredicate) {
      return null;
    }
    return (
      <MenuItem
        active={statusItem.type === status.type}
        disabled={modifiers.disabled}
        key={statusItem.label}
        onClick={handleClick}
        onFocus={handleFocus}
        text={statusItem.label}
      />
    );
  };

  return (
    <Select<IStatusItem>
      items={feedbackStatusList}
      onItemSelect={handleChange}
      itemRenderer={renderStatus}
      filterable={false}
      popoverProps={{ minimal: true, placement: "bottom-start" }}
    >
      <Button rightIcon="caret-down" alignText="left" text={status.label} tabIndex={0} />
    </Select>
  );
}

export const unassignedUser: User = {
  id: "unassigned",
  name: "Unassigned",
  role: null,
};

export function SelectAssignee({
  assignee,
  setAssignee,
}: {
  assignee: User | null | undefined;
  setAssignee: Dispatch<SetStateAction<User>>;
}) {
  const { data: admins } = useQuery(ReadUsersDocument, {
    fetchPolicy: "cache-and-network",
    variables: {
      where: { role: { equals: "admin" } },
    },
  });

  const handleChange = (selectedUser: User) => {
    setAssignee(selectedUser);
  };

  const users = [unassignedUser, ...(admins?.readUsers ?? [])];

  const renderAdmins: ItemRenderer<User> = (user, { handleClick, handleFocus, modifiers }) => {
    if (!modifiers.matchesPredicate) {
      return null;
    }

    return (
      <MenuItem
        active={user.id === assignee?.id}
        disabled={modifiers.disabled}
        key={user.id || "unassigned"}
        onClick={handleClick}
        onFocus={handleFocus}
        text={user.name || "unassigned"}
      />
    );
  };

  return (
    <Select<User>
      items={users}
      activeItem={assignee}
      onItemSelect={handleChange}
      itemRenderer={renderAdmins}
      filterable={false}
      popoverProps={{ minimal: true, placement: "bottom-start" }}
    >
      <Button icon="user" rightIcon="caret-down" alignText="left" text={assignee?.name} tabIndex={0} />
    </Select>
  );
}
