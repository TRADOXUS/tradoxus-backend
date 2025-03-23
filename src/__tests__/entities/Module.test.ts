import { Module } from '../../entities/Module';
import { validate } from 'class-validator';
import { Course } from '../../entities/Course';
import { Lesson } from '../../entities/Lesson';

describe('Module Entity', () => {
    let module: Module;
    let mockCourse: Course;

    beforeEach(() => {
        mockCourse = new Course();
        module = new Module();
        module.course = mockCourse;
    });

    it('should create a valid module', async () => {
        module.title = 'Test Module';
        module.description = 'Test Description';
        module.order = 1;

        const errors = await validate(module);
        expect(errors.length).toBe(0);
    });

    it('should fail validation with empty title', async () => {
        module.title = '';
        module.description = 'Test Description';

        const errors = await validate(module);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].property).toBe('title');
    });

    it('should fail validation with title shorter than 3 characters', async () => {
        module.title = 'Te';
        module.description = 'Test Description';

        const errors = await validate(module);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].property).toBe('title');
    });

    it('should fail validation with title longer than 100 characters', async () => {
        module.title = 'a'.repeat(101);
        module.description = 'Test Description';

        const errors = await validate(module);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].property).toBe('title');
    });

    it('should fail validation with negative order', async () => {
        module.title = 'Test Module';
        module.order = -1;

        const errors = await validate(module);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].property).toBe('order');
    });

    it('should allow undefined description', async () => {
        module.title = 'Test Module';
        module.description = undefined;

        const errors = await validate(module);
        expect(errors.length).toBe(0);
    });

    it('should require course relationship', async () => {
        module.title = 'Test Module';
        module.course = undefined as any;

        const errors = await validate(module);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].property).toBe('course');
    });

    it('should initialize empty lessons array', () => {
        expect(module.lessons).toBeDefined();
        expect(Array.isArray(module.lessons)).toBe(true);
        expect(module.lessons.length).toBe(0);
    });

    it('should handle lesson relationship', () => {
        const mockLesson = new Lesson();
        module.lessons = [mockLesson];
        
        expect(module.lessons).toContain(mockLesson);
        expect(module.lessons.length).toBe(1);
    });
}); 