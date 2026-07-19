import { beforeEach, describe, expect, it } from "vitest";
import { store } from "@/lib/storage";
import type { StudyGuide } from "@/lib/types";

describe("guest persistence", () => {
  beforeEach(() => localStorage.clear());
  it("recovers a saved study guide after an in-memory refresh", () => {
    const guide: StudyGuide = { id:"g1",title:"Test",subject:"",fileType:"text",text:"A long enough test source.",wordCount:5,characterCount:26,headingCount:0,topics:["Test"],warnings:[],createdAt:new Date().toISOString(),updatedAt:new Date().toISOString() };
    store.saveGuide(guide);
    expect(store.guides()).toEqual([guide]);
  });
});
