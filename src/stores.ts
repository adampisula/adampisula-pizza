import { writable } from "svelte/store";

export const path = writable("/");

export const commandLoading = writable(false);