import { Lesson } from '../../entities/Lesson';
import { validate } from 'class-validator';
import { Module } from '../../entities/Module';
import { Capsule } from '../../entities/Capsule';

describe('Lesson Entity', () => {
    let lesson: Lesson;
    let mockModule: Module;

    beforeEach(() => {
        mockModule = new Module();
        lesson = new Lesson();
        lesson.module = mockModule;
    });

    it('should create a valid lesson', async () => {
        lesson.title = 'Test Lesson';
        lesson.description = 'Test Description';
        lesson.order = 1;
        lesson.prerequisites = ['lesson1', 'lesson2'];

        const errors = await validate(lesson);
        expect(errors.length).toBe(0);
    });

    it('should fail validation with empty title', async () => {
        lesson.title = '';
        lesson.description = 'Test Description';

        const errors = await validate(lesson);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].property).toBe('title');
    });

    it('should fail validation with title shorter than 3 characters', async () => {
        lesson.title = 'Te';
        lesson.description = 'Test Description';

        const errors = await validate(lesson);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].property).toBe('title');
    });

    it('should fail validation with title longer than 100 characters', async () => {
        lesson.title = 'a'.repeat(101);
        lesson.description = 'Test Description';

        const errors = await validate(lesson);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].property).toBe('title');
    });

    it('should fail validation with negative order', async () => {
        lesson.title = 'Test Lesson';
        lesson.order = -1;

        const errors = await validate(lesson);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].property).toBe('order');
    });

    it('should allow undefined description', async () => {
        lesson.title = 'Test Lesson';
        lesson.description = undefined;

        const errors = await validate(lesson);
        expect(errors.length).toBe(0);
    });

    it('should allow undefined prerequisites', async () => {
        lesson.title = 'Test Lesson';
        lesson.prerequisites = undefined;

        const errors = await validate(lesson);
        expect(errors.length).toBe(0);
    });

    it('should validate prerequisites as array when provided', async () => {
        lesson.title = 'Test Lesson';
        lesson.prerequisites = 'invalid' as any;

        const errors = await validate(lesson);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].property).toBe('prerequisites');
    });

    it('should require module relationship', async () => {
        lesson.title = 'Test Lesson';
        lesson.module = undefined as any;

        const errors = await validate(lesson);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].property).toBe('module');
    });

    it('should initialize empty capsules array', () => {
        expect(lesson.capsules).toBeDefined();
        expect(Array.isArray(lesson.capsules)).toBe(true);
        expect(lesson.capsules.length).toBe(0);
    });
}); 