"use client";

import React, { useState } from "react";
import { X, Upload, CheckCircle2, AlertCircle, FileText } from "lucide-react";
import { ingestManualRecord, uploadCSVFile } from "../lib/api";

interface IngestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const IngestModal: React.FC<IngestModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [tab, setTab] = useState<"manual" | "csv">("manual");
  const [provider, setProvider] = useState("openai");
  const [model, setModel] = useState("gpt-4o");
  const [inputTokens, setInputTokens] = useState("1200");
  const [outputTokens, setOutputTokens] = useState("450");
  const [projectTag, setProjectTag] = useState("coding-assistant");
  const [file, setFile] = useState<File | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMessage(null);
    try {
      await ingestManualRecord({
        provider,
        model,
        input_tokens: parseInt(inputTokens, 10) || 0,
        output_tokens: parseInt(outputTokens, 10) || 0,
        project_tag: projectTag,
      });
      setStatusMessage({
        type: "success",
        text: "Usage record ingested successfully!",
      });
      onSuccess();
      setTimeout(() => {
        onClose();
        setStatusMessage(null);
      }, 1200);
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err.message || "Failed to ingest record",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCSVSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setStatusMessage({ type: "error", text: "Please select a CSV file." });
      return;
    }
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const records = await uploadCSVFile(file, projectTag);
      setStatusMessage({
        type: "success",
        text: `Uploaded and parsed ${records.length} records!`,
      });
      onSuccess();
      setTimeout(() => {
        onClose();
        setStatusMessage(null);
      }, 1200);
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err.message || "Failed to upload CSV file",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Ingest LLM Usage Records
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Record token consumption directly or import batch usage logs
        </p>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 mt-4 mb-5">
          <button
            onClick={() => setTab("manual")}
            className={`pb-2 text-xs font-semibold px-3 border-b-2 transition-all ${
              tab === "manual"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            Manual Entry
          </button>
          <button
            onClick={() => setTab("csv")}
            className={`pb-2 text-xs font-semibold px-3 border-b-2 transition-all ${
              tab === "csv"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            CSV File Upload
          </button>
        </div>

        {statusMessage && (
          <div
            className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-xs ${
              statusMessage.type === "success"
                ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                : "bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
            }`}
          >
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {tab === "manual" ? (
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Provider
                </label>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg p-2 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="gemini">Google Gemini</option>
                  <option value="azure_openai">Azure OpenAI</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Model
                </label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg p-2 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Prompt Tokens
                </label>
                <input
                  type="number"
                  value={inputTokens}
                  onChange={(e) => setInputTokens(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg p-2 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Output Tokens
                </label>
                <input
                  type="number"
                  value={outputTokens}
                  onChange={(e) => setOutputTokens(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg p-2 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Project Attribution Tag
              </label>
              <input
                type="text"
                value={projectTag}
                onChange={(e) => setProjectTag(e.target.value)}
                placeholder="e.g. coding-assistant, rag-pipeline"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg p-2 text-xs outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-all disabled:opacity-50"
              >
                {isLoading ? "Ingesting..." : "Ingest Record"}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleCSVSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Upload CSV File
              </label>
              <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-5 text-center hover:border-blue-500 transition-colors">
                <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="text-xs text-slate-600 dark:text-slate-400 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                CSV Headers: timestamp, provider, model, input_tokens, output_tokens, cost_usd
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Default Project Tag
              </label>
              <input
                type="text"
                value={projectTag}
                onChange={(e) => setProjectTag(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg p-2 text-xs outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !file}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-all disabled:opacity-50"
              >
                {isLoading ? "Uploading..." : "Upload & Parse"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
