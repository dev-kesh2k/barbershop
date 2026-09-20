import { useRef, useState } from "react";
import { ApiError, api, resolveImageUrl } from "../lib/api";

type Props = {
  label?: string;
  value: string;
  onChange: (url: string) => void;
  required?: boolean;
};

export default function ImageField({
  label = "Imagem",
  value,
  onChange,
  required,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [showUrl, setShowUrl] = useState(false);

  const pickFile = async (file: File | null) => {
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const { url } = await api.uploadImage(file);
      onChange(url);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Falha ao enviar imagem.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const preview = resolveImageUrl(value);

  return (
    <div className="form-group image-field">
      <label className="label">{label}</label>

      {preview ? (
        <img src={preview} alt="Pré-visualização" className="image-preview" />
      ) : (
        <div className="image-placeholder">Nenhuma imagem selecionada</div>
      )}

      <div className="image-actions">
        <button
          type="button"
          className="btn btn-secondary btn-block"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? "Enviando..." : "Escolher da galeria"}
        </button>
        <button
          type="button"
          className="btn btn-secondary btn-block"
          onClick={() => setShowUrl((v) => !v)}
        >
          {showUrl ? "Ocultar URL" : "Usar URL"}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
      />

      {showUrl && (
        <input
          className="input"
          style={{ marginTop: "0.65rem" }}
          placeholder="https://... ou deixe o arquivo local"
          value={value.startsWith("http") || value.startsWith("data:") ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          required={required && !value}
        />
      )}

      {!showUrl && required && !value && (
        <input tabIndex={-1} required value="" onChange={() => undefined} style={{ display: "none" }} />
      )}

      {error && <div className="alert alert-error" style={{ marginTop: "0.65rem" }}>{error}</div>}

      <style>{`
        .image-preview {
          width: 100%;
          height: 160px;
          object-fit: cover;
          border-radius: 12px;
          border: 1px solid var(--border);
          margin-bottom: 0.65rem;
        }
        .image-placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 120px;
          border-radius: 12px;
          border: 1px dashed var(--border);
          color: var(--text-muted);
          font-size: 0.9rem;
          margin-bottom: 0.65rem;
        }
        .image-actions {
          display: grid;
          gap: 0.45rem;
        }
      `}</style>
    </div>
  );
}
