"use client";

import { useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { postForumMessage } from "@/app/forum/actions";
import type { ActionState } from "@/lib/action-state";

const initial: ActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn" disabled={pending}>
      {pending ? "Publication..." : "Publier"}
    </button>
  );
}

export default function PostMessageForm() {
  const [state, formAction] = useFormState(postForumMessage, initial);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await formAction(formData);
        formRef.current?.reset();
      }}
      className="card space-y-3"
    >
      <div>
        <label className="label">Nouveau message</label>
        <textarea name="content" required maxLength={2000} rows={3} className="input" />
      </div>
      <SubmitButton />
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
