"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
  useState,
} from "react";

import type {
  AwsConnectionCompleteResponse,
  AwsConnectionStartResponse,
  AwsS3CheckResponse,
  JsonObject,
} from "../workspace-types";

export type AwsConnectionMode = "access_key" | "iam_role";
export type AwsPanelMode = "keys" | "role";

type AwsIntegrationContextValue = {
  isPanelOpen: boolean;
  setIsPanelOpen: (value: boolean) => void;
  isAwsConnected: boolean;
  setIsAwsConnected: (value: boolean) => void;
  connectionMode: AwsConnectionMode | null;
  setConnectionMode: (value: AwsConnectionMode | null) => void;
  bucketName: string;
  setBucketName: (value: string) => void;
  region: string;
  setRegion: (value: string) => void;
  lastCheckResult: AwsS3CheckResponse | null;
  setLastCheckResult: (value: AwsS3CheckResponse | null) => void;
  discoveredValues: JsonObject;
  setDiscoveredValues: (value: JsonObject) => void;
  missingItems: string[];
  setMissingItems: (value: string[]) => void;
  warnings: string[];
  setWarnings: (value: string[]) => void;
  lastCheckedAt: string | null;
  setLastCheckedAt: (value: string | null) => void;
  accessKeyId: string;
  setAccessKeyId: (value: string) => void;
  secretAccessKey: string;
  setSecretAccessKey: (value: string) => void;
  sessionToken: string;
  setSessionToken: (value: string) => void;
  panelMode: AwsPanelMode;
  setPanelMode: (value: AwsPanelMode) => void;
  activeAction: string | null;
  setActiveAction: (value: string | null) => void;
  errorMessage: string | null;
  setErrorMessage: (value: string | null) => void;
  connectionName: string;
  setConnectionName: (value: string) => void;
  startResult: AwsConnectionStartResponse | null;
  setStartResult: (value: AwsConnectionStartResponse | null) => void;
  roleArn: string;
  setRoleArn: (value: string) => void;
  connectionResult: AwsConnectionCompleteResponse | null;
  setConnectionResult: (value: AwsConnectionCompleteResponse | null) => void;
  roleBucketName: string;
  setRoleBucketName: (value: string) => void;
  resetAwsIntegration: () => void;
};

const AwsIntegrationContext =
  createContext<AwsIntegrationContextValue | null>(null);

export function AwsIntegrationProvider({ children }: { children: ReactNode }) {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isAwsConnected, setIsAwsConnected] = useState(false);
  const [connectionMode, setConnectionMode] =
    useState<AwsConnectionMode | null>(null);
  const [bucketName, setBucketName] = useState("");
  const [region, setRegion] = useState("");
  const [lastCheckResult, setLastCheckResult] =
    useState<AwsS3CheckResponse | null>(null);
  const [discoveredValues, setDiscoveredValues] = useState<JsonObject>({});
  const [missingItems, setMissingItems] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [lastCheckedAt, setLastCheckedAt] = useState<string | null>(null);

  const [accessKeyId, setAccessKeyId] = useState("");
  const [secretAccessKey, setSecretAccessKey] = useState("");
  const [sessionToken, setSessionToken] = useState("");

  const [panelMode, setPanelMode] = useState<AwsPanelMode>("keys");
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [connectionName, setConnectionName] = useState("demo");
  const [startResult, setStartResult] =
    useState<AwsConnectionStartResponse | null>(null);
  const [roleArn, setRoleArn] = useState("");
  const [connectionResult, setConnectionResult] =
    useState<AwsConnectionCompleteResponse | null>(null);
  const [roleBucketName, setRoleBucketName] = useState("");

  function resetAwsIntegration() {
    setIsPanelOpen(false);
    setIsAwsConnected(false);
    setConnectionMode(null);
    setBucketName("");
    setRegion("");
    setLastCheckResult(null);
    setDiscoveredValues({});
    setMissingItems([]);
    setWarnings([]);
    setLastCheckedAt(null);
    setAccessKeyId("");
    setSecretAccessKey("");
    setSessionToken("");
    setErrorMessage(null);
    setStartResult(null);
    setRoleArn("");
    setConnectionResult(null);
    setRoleBucketName("");
  }

  const value = useMemo(
    () => ({
      isPanelOpen,
      setIsPanelOpen,
      isAwsConnected,
      setIsAwsConnected,
      connectionMode,
      setConnectionMode,
      bucketName,
      setBucketName,
      region,
      setRegion,
      lastCheckResult,
      setLastCheckResult,
      discoveredValues,
      setDiscoveredValues,
      missingItems,
      setMissingItems,
      warnings,
      setWarnings,
      lastCheckedAt,
      setLastCheckedAt,
      accessKeyId,
      setAccessKeyId,
      secretAccessKey,
      setSecretAccessKey,
      sessionToken,
      setSessionToken,
      panelMode,
      setPanelMode,
      activeAction,
      setActiveAction,
      errorMessage,
      setErrorMessage,
      connectionName,
      setConnectionName,
      startResult,
      setStartResult,
      roleArn,
      setRoleArn,
      connectionResult,
      setConnectionResult,
      roleBucketName,
      setRoleBucketName,
      resetAwsIntegration,
    }),
    [
      accessKeyId,
      activeAction,
      bucketName,
      connectionMode,
      connectionName,
      connectionResult,
      discoveredValues,
      errorMessage,
      isAwsConnected,
      isPanelOpen,
      lastCheckResult,
      lastCheckedAt,
      missingItems,
      panelMode,
      region,
      roleArn,
      roleBucketName,
      secretAccessKey,
      sessionToken,
      startResult,
      warnings,
    ],
  );

  return (
    <AwsIntegrationContext.Provider value={value}>
      {children}
    </AwsIntegrationContext.Provider>
  );
}

export function useAwsIntegration() {
  const value = useContext(AwsIntegrationContext);
  if (!value) {
    throw new Error("useAwsIntegration must be used inside AwsIntegrationProvider");
  }
  return value;
}
