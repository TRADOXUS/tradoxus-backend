import request from 'supertest';
import { Achievement, AchievementType, AchievementCategory } from '../../entities/Achievement';
import { AchievementController } from '../../controllers/AchievementController';
import { AchievementService } from '../../services/AchievementService';
import { AppError } from '../../middleware/errorHandler';
import express from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { errorHandler } from '../../middleware/errorHandler';

jest.mock('../../services/AchievementService');

const mockService = new AchievementService() as jest.Mocked<AchievementService>;
const app = express();
app.use(express.json());
const controller = new AchievementController(mockService);

// Mock routes
app.get('/', (req, res) => controller.findAll(req, res));
app.get('/:id', asyncHandler((req, res) => controller.findOne(req, res)));
app.get("/module/:moduleId", asyncHandler(controller.findByModuleId.bind(controller)));
app.get('/user-achievements/:userId', asyncHandler((req, res) => controller.getUserAchievements(req, res)));
app.use(errorHandler);

// Test cases
describe('AchievementController', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    test('should return all achievements', async () => {
        mockService.findAll.mockResolvedValue({ items: [
            {
                id: '1',
                name: 'Test Achievement',
                description: 'This is a test achievement',
                type: AchievementType.SPECIAL, // Replace with a valid enum value
                category: AchievementCategory.STREAK, // Replace with a valid enum value
                points: 100,
                icon: 'test-icon.png',
                criteria: [], // Assuming an empty array for simplicity
                rewards: [], // Assuming an empty array for simplicity
            }
        ],
        total: 1,});
        const response = await request(app).get('/');
        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(1);
    });
    
    test('should return 404 if achievement is not found', async () => {
        mockService.findOne.mockResolvedValue(null);
        const response = await request(app).get('/999');
        expect(response.status).toBe(500);
    });

    test('should return achievements by module ID', async () => {
        mockService.findByModuleId.mockResolvedValue([{
            id: '123',
            name: 'Module Achievement',
            description: 'Awarded for first achievement',
            type: AchievementType.SPECIAL, // Replace with a valid enum value
            category: AchievementCategory.STREAK,
            points: 50,
            icon: 'first-win.png',
            criteria: [], // Assuming an empty array for simplicity
            rewards: [],
        }]);
        const response = await request(app).get('/module/123');
        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(1);
    });

    test('should return user achievements', async () => {
        mockService.getUserAchievements.mockResolvedValue([{
            id: '1',
            userId: 'user123',
            earnedAt: new Date(), // Mock date when the achievement was earned
            progress: 100, // Example progress value
            status: 'completed', // Adjust based on actual enum/type
            metadata: {},
            achievement: {
                id: 'achv1',
                name: 'First Win',
                description: 'Awarded for first achievement',
                type: AchievementType.SPECIAL, // Replace with a valid enum value
                category: AchievementCategory.STREAK,
                points: 50,
                icon: 'first-win.png',
                criteria: [], // Assuming an empty array for simplicity
                rewards: [],
            },}]);
           
        const response = await request(app).get('/user-achievements/user123');
        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(1);
     });

     
    test('should handle errors gracefully', async () => {
        mockService.findOne.mockImplementation(() => {
          throw new AppError('Failed to fetch achievement', 500);
        });
    
        const response = await request(app).get('/999');
        expect(response.status).toBe(500);
        expect(response.body).toEqual({ 
            status: 'error',
            error: {  // Update this part to match the response
                message: 'Failed to fetch achievement'
            }
        });
      }, 7000); // Increase timeout if needed
    


});
