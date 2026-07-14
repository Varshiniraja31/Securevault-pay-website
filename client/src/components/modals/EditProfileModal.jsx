import { useState, useEffect } from "react";
import Modal from "../Modal";
import Input, { Field } from "../Input";
import Button from "../Button";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

export default function EditProfileModal({ open, onClose }) {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ name: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && user) {
      setForm({ name: user.name || "", phone: user.phone || "" });
      setError("");
    }
  }, [open, user]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await updateUser(form);
      toast.success("Profile updated");
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit Profile">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Full name">
          <Input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            autoFocus
          />
        </Field>
        <Field label="Phone number" hint="Optional">
          <Input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </Field>
        {error && <p className="text-sm text-rose-500">{error}</p>}
        <Button type="submit" className="w-full" size="lg" loading={loading}>
          Save Changes
        </Button>
      </form>
    </Modal>
  );
}
