# 🤝 Contributing to AquaFarm Pro

Thank you for your interest in contributing to AquaFarm Pro! This document provides guidelines and information for contributors.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Contributing Process](#contributing-process)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Issue Guidelines](#issue-guidelines)
- [Pull Request Process](#pull-request-process)

## 📜 Code of Conduct

This project follows our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you agree to uphold this code.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- Git
- PostgreSQL 15+ (or Docker)
- Redis 7+ (or Docker)

### Fork and Clone

```bash
# Fork the repository on GitHub
# Then clone your fork
git clone https://github.com/yourusername/aquafarm-pro.git
cd aquafarm-pro

# Add upstream remote
git remote add upstream https://github.com/original-owner/aquafarm-pro.git
```

## 🛠️ Development Setup

### 1. Environment Setup

```bash
# Copy environment files
cp env.dev.example .env
cp backend/env.dev.example backend/.env
cp frontend/env.dev.example frontend/.env
```

### 2. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install

# Mobile (optional)
cd ../mobile
npm install
```

### 3. Database Setup

```bash
# Using Docker (recommended)
docker-compose -f docker-compose.dev.yml up -d

# Or manual setup
createdb aquafarm_pro_dev
npm run migration:run
```

### 4. Start Development Servers

```bash
# Backend (Terminal 1)
cd backend
npm run start:dev

# Frontend (Terminal 2)
cd frontend
npm run dev

# Mobile (Terminal 3 - optional)
cd mobile
npm run start
```

## 🔄 Contributing Process

### 1. Create a Branch

```bash
# Update main branch
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
# or
git checkout -b docs/documentation-update
```

### 2. Make Changes

- Write clean, readable code
- Follow our coding standards
- Add tests for new functionality
- Update documentation as needed

### 3. Test Your Changes

```bash
# Run all tests
npm run test

# Backend tests
cd backend && npm run test

# Frontend tests
cd frontend && npm run test

# Linting
npm run lint
npm run format:check
```

### 4. Commit Changes

```bash
# Stage changes
git add .

# Commit with conventional commit message
git commit -m "feat: add water quality prediction feature"
# or
git commit -m "fix: resolve authentication issue in mobile app"
# or
git commit -m "docs: update API documentation"
```

### 5. Push and Create PR

```bash
# Push to your fork
git push origin feature/your-feature-name

# Create Pull Request on GitHub
```

## 📏 Coding Standards

### TypeScript/JavaScript

```typescript
// ✅ Good
interface WaterQualityData {
  temperature: number;
  ph: number;
  dissolvedOxygen: number;
  timestamp: Date;
}

const calculateWaterQualityScore = (data: WaterQualityData): number => {
  // Implementation
  return score;
};

// ❌ Bad
const calcScore = (d) => {
  // Implementation
  return s;
};
```

### React Components

```tsx
// ✅ Good
interface FishTankProps {
  tankId: string;
  capacity: number;
  currentStock: number;
  onStockUpdate: (newStock: number) => void;
}

export const FishTank: React.FC<FishTankProps> = ({
  tankId,
  capacity,
  currentStock,
  onStockUpdate,
}) => {
  const utilizationPercentage = (currentStock / capacity) * 100;

  return (
    <div className="fish-tank">
      <h3>Tank {tankId}</h3>
      <div>Utilization: {utilizationPercentage.toFixed(1)}%</div>
    </div>
  );
};

// ❌ Bad
export const FishTank = ({ tankId, capacity, currentStock, onStockUpdate }) => {
  return (
    <div>
      <h3>Tank {tankId}</h3>
      <div>Utilization: {(currentStock / capacity) * 100}%</div>
    </div>
  );
};
```

### NestJS Services

```typescript
// ✅ Good
@Injectable()
export class WaterQualityService {
  constructor(
    @InjectRepository(WaterQualityReading)
    private readonly waterQualityRepository: Repository<WaterQualityReading>,
    private readonly logger: Logger,
  ) {}

  async createReading(readingData: CreateWaterQualityDto): Promise<WaterQualityReading> {
    try {
      const reading = this.waterQualityRepository.create(readingData);
      const savedReading = await this.waterQualityRepository.save(reading);
      
      this.logger.log(`Water quality reading created: ${savedReading.id}`);
      return savedReading;
    } catch (error) {
      this.logger.error('Failed to create water quality reading', error);
      throw new InternalServerErrorException('Failed to save water quality reading');
    }
  }
}
```

### CSS/Styling

```css
/* ✅ Good - Use CSS Modules or styled-components */
.fishTank {
  display: flex;
  flex-direction: column;
  padding: 1rem;
  border-radius: 8px;
  background-color: var(--color-surface);
}

.fishTankHeader {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--color-primary);
}

/* ❌ Bad - Avoid global styles and magic numbers */
div {
  display: flex;
  padding: 16px;
  background: #f5f5f5;
}
```

## 🧪 Testing Guidelines

### Unit Tests

```typescript
// ✅ Good test example
describe('WaterQualityService', () => {
  let service: WaterQualityService;
  let repository: Repository<WaterQualityReading>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WaterQualityService,
        {
          provide: getRepositoryToken(WaterQualityReading),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<WaterQualityService>(WaterQualityService);
    repository = module.get<Repository<WaterQualityReading>>(
      getRepositoryToken(WaterQualityReading),
    );
  });

  it('should create a water quality reading', async () => {
    const readingData = {
      temperature: 25.5,
      ph: 7.2,
      dissolvedOxygen: 8.5,
      tankId: 'tank-1',
    };

    const mockReading = { id: '1', ...readingData, timestamp: new Date() };
    jest.spyOn(repository, 'create').mockReturnValue(mockReading as any);
    jest.spyOn(repository, 'save').mockResolvedValue(mockReading);

    const result = await service.createReading(readingData);

    expect(result).toEqual(mockReading);
    expect(repository.create).toHaveBeenCalledWith(readingData);
    expect(repository.save).toHaveBeenCalledWith(mockReading);
  });
});
```

### Integration Tests

```typescript
// ✅ Good integration test
describe('Water Quality API (e2e)', () => {
  let app: INestApplication;
  let jwtToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Setup test user and get JWT token
    jwtToken = await setupTestUser(app);
  });

  it('/water-quality (POST)', () => {
    return request(app.getHttpServer())
      .post('/water-quality')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({
        temperature: 25.5,
        ph: 7.2,
        dissolvedOxygen: 8.5,
        tankId: 'test-tank-1',
      })
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('id');
        expect(res.body.temperature).toBe(25.5);
      });
  });
});
```

### Test Coverage Requirements

- **Unit Tests**: Minimum 80% coverage
- **Integration Tests**: All API endpoints covered
- **E2E Tests**: Critical user journeys covered

## 📚 Documentation

### API Documentation

- Use Swagger decorators for all endpoints
- Provide examples for request/response
- Document error cases

```typescript
// ✅ Good API documentation
@ApiOperation({ summary: 'Create water quality reading' })
@ApiResponse({ 
  status: 201, 
  description: 'Water quality reading created successfully',
  type: WaterQualityReading,
})
@ApiResponse({ 
  status: 400, 
  description: 'Invalid input data',
  type: ValidationErrorResponse,
})
@Post()
async createReading(@Body() createReadingDto: CreateWaterQualityDto) {
  return this.waterQualityService.createReading(createReadingDto);
}
```

### Code Comments

```typescript
// ✅ Good comments
/**
 * Calculates the overall water quality score based on multiple parameters.
 * 
 * @param temperature - Water temperature in Celsius
 * @param ph - pH level (0-14)
 * @param dissolvedOxygen - Dissolved oxygen in mg/L
 * @param ammonia - Ammonia level in mg/L
 * @returns Water quality score (0-100, where 100 is perfect)
 */
function calculateWaterQualityScore(
  temperature: number,
  ph: number,
  dissolvedOxygen: number,
  ammonia: number,
): number {
  // Implementation
}
```

### README Updates

- Update README.md for new features
- Add setup instructions for new dependencies
- Update API examples

## 🐛 Issue Guidelines

### Bug Reports

Use the bug report template and include:

- **Environment**: OS, Node.js version, browser
- **Steps to reproduce**: Clear, numbered steps
- **Expected behavior**: What should happen
- **Actual behavior**: What actually happens
- **Screenshots**: If applicable
- **Logs**: Error messages and console output

### Feature Requests

Use the feature request template and include:

- **Problem**: What problem does this solve?
- **Solution**: Describe your proposed solution
- **Alternatives**: Other solutions you've considered
- **Additional context**: Any other relevant information

### Issue Labels

- `bug`: Something isn't working
- `enhancement`: New feature or request
- `documentation`: Improvements to documentation
- `good first issue`: Good for newcomers
- `help wanted`: Extra attention is needed
- `question`: Further information is requested

## 🔄 Pull Request Process

### Before Submitting

- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Tests added/updated and passing
- [ ] Documentation updated
- [ ] No console.log statements
- [ ] No commented-out code

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Screenshots (if applicable)
Add screenshots to help explain your changes

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or marked as such)
```

### Review Process

1. **Automated Checks**: CI/CD pipeline runs tests and linting
2. **Code Review**: At least one maintainer reviews the code
3. **Testing**: Manual testing if needed
4. **Approval**: Maintainer approves and merges

## 🏷️ Commit Message Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

feat(auth): add OAuth2 login support
fix(api): resolve water quality calculation bug
docs(readme): update installation instructions
style(ui): improve button hover effects
refactor(db): optimize water quality queries
test(auth): add unit tests for JWT service
chore(deps): update dependencies to latest versions
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

## 🎯 Development Focus Areas

### High Priority

- Performance optimization
- Security improvements
- Mobile app enhancements
- API documentation
- Test coverage

### Medium Priority

- UI/UX improvements
- New features
- Integration with external services
- Advanced analytics

### Low Priority

- Code refactoring
- Documentation updates
- Developer experience improvements

## 🆘 Getting Help

### Resources

- **Documentation**: Check the `docs/` folder
- **Issues**: Search existing issues first
- **Discussions**: Use GitHub Discussions for questions
- **Discord**: Join our community Discord (if available)

### Contact

- **Maintainers**: @maintainer1, @maintainer2
- **Email**: dev@aquafarm-pro.com
- **Discord**: [Join our server](https://discord.gg/aquafarm-pro)

## 🎉 Recognition

Contributors will be recognized in:

- CONTRIBUTORS.md file
- Release notes
- Project documentation
- Social media (with permission)

## 📝 License

By contributing, you agree that your contributions will be licensed under the same license as the project (MIT License).

---

Thank you for contributing to AquaFarm Pro! 🐟✨