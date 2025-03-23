import { Capsule, CapsuleType } from '../../entities/Capsule';
import { validate } from 'class-validator';
import { Lesson } from '../../entities/Lesson';

describe('Capsule Entity', () => {
    let capsule: Capsule;
    let mockLesson: Lesson;

    beforeEach(() => {
        mockLesson = new Lesson();
        capsule = new Capsule();
        capsule.lesson = mockLesson;
    });

    it('should create a valid capsule', async () => {
        capsule.title = 'Test Capsule';
        capsule.description = 'Test Description';
        capsule.order = 1;
        capsule.type = CapsuleType.TEXT;
        capsule.content = { text: 'Test content' };

        const errors = await validate(capsule);
        expect(errors.length).toBe(0);
    });

    it('should fail validation with empty title', async () => {
        capsule.title = '';
        capsule.description = 'Test Description';

        const errors = await validate(capsule);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].property).toBe('title');
    });

    it('should fail validation with title shorter than 3 characters', async () => {
        capsule.title = 'Te';
        capsule.description = 'Test Description';

        const errors = await validate(capsule);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].property).toBe('title');
    });

    it('should fail validation with title longer than 100 characters', async () => {
        capsule.title = 'a'.repeat(101);
        capsule.description = 'Test Description';

        const errors = await validate(capsule);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].property).toBe('title');
    });

    it('should fail validation with negative order', async () => {
        capsule.title = 'Test Capsule';
        capsule.order = -1;

        const errors = await validate(capsule);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].property).toBe('order');
    });

    it('should allow undefined description', async () => {
        capsule.title = 'Test Capsule';
        capsule.description = undefined;

        const errors = await validate(capsule);
        expect(errors.length).toBe(0);
    });

    it('should allow undefined content', async () => {
        capsule.title = 'Test Capsule';
        capsule.content = undefined;

        const errors = await validate(capsule);
        expect(errors.length).toBe(0);
    });

    it('should validate content as object when provided', async () => {
        capsule.title = 'Test Capsule';
        capsule.content = 'invalid content' as any;

        const errors = await validate(capsule);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].property).toBe('content');
    });

    it('should require lesson relationship', async () => {
        capsule.title = 'Test Capsule';
        capsule.lesson = undefined as any;

        const errors = await validate(capsule);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].property).toBe('lesson');
    });
}); 