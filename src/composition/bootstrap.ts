import type { ApplicationServices } from "@/application/createApplicationServices";
import { getApplication } from "@/application/getApplication";
import { createApp } from "./createApp";

let started = false;

export function ensureApplication(): ApplicationServices {
  if (!started) {
    createApp();
    started = true;
  }
  return getApplication();
}

export function resetBootstrap(): void {
  started = false;
}
