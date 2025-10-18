import featureFlagsConfig from "./feature-flags.config.json";

type Environment = "local" | "integration" | "production";
type Feature = "auth" | "pages" | "forms" | string;

const getEnv = (): Environment => {
  const env = import.meta.env.PUBLIC_ENV_NAME;

  if (env === "production" || env === "prod") {
    return "production";
  }

  if (env === "integration" || env === "int") {
    return "integration";
  }

  return "local";
};

const isFeatureEnabled = (featureName: Feature): boolean => {
  const env = getEnv();
  const features = featureFlagsConfig[env];

  return features?.[featureName as keyof typeof features] ?? true;
};

export { isFeatureEnabled };
