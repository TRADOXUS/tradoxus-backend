import { Course } from "../../entities/Course";
import { validate } from "class-validator";

describe("Course Entity", () => {
  let course: Course;

  beforeEach(() => {
    course = new Course();
  });

  it("should create a valid course", async () => {
    course.title = "Test Course";
    course.description = "Test Description";
    course.isPublished = false;
    course.thumbnailUrl = "https://example.com/thumbnail.jpg";

    const errors = await validate(course);
    expect(errors.length).toBe(0);
  });

  it("should fail validation with empty title", async () => {
    course.title = "";
    course.description = "Test Description";

    const errors = await validate(course);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe("title");
  });

  it("should fail validation with title shorter than 3 characters", async () => {
    course.title = "Te";
    course.description = "Test Description";

    const errors = await validate(course);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe("title");
  });

  it("should fail validation with title longer than 100 characters", async () => {
    course.title = "a".repeat(101);
    course.description = "Test Description";

    const errors = await validate(course);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe("title");
  });

  it("should allow undefined description", async () => {
    course.title = "Test Course";
    course.description = undefined;

    const errors = await validate(course);
    expect(errors.length).toBe(0);
  });

  it("should allow undefined thumbnailUrl", async () => {
    course.title = "Test Course";
    course.description = "Test Description";
    course.thumbnailUrl = undefined;

    const errors = await validate(course);
    expect(errors.length).toBe(0);
  });
});
