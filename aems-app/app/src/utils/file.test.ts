import { randomUUID } from "node:crypto";
import { getObjectKey } from "./file";

// Mock the crypto module
jest.mock('node:crypto', () => ({
    randomUUID: jest.fn(),
}));

describe("getObjectKey", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("A single file with an extension", () => {
        (randomUUID as jest.Mock).mockReturnValue('mocked-uuid');
        const file = { name: 'test.jpg' } as File;
        const result = getObjectKey(file);
        expect(result).toBe('mocked-uuid.jpg');
        expect(randomUUID).toHaveBeenCalledTimes(1);
    });

    test("Multiple files with different extensions", () => {
        (randomUUID as jest.Mock)
            .mockReturnValueOnce('uuid-1')
            .mockReturnValueOnce('uuid-2')
            .mockReturnValueOnce('uuid-3');

        const file1 = { name: 'test1.jpg' } as File;
        const file2 = { name: 'test2.png' } as File;
        const file3 = { name: 'test3.pdf' } as File;

        expect(getObjectKey(file1)).toBe('uuid-1.jpg');
        expect(getObjectKey(file2)).toBe('uuid-2.png');
        expect(getObjectKey(file3)).toBe('uuid-3.pdf');

        expect(randomUUID).toHaveBeenCalledTimes(3);
    });

    test("A single file with no extension", () => {
        (randomUUID as jest.Mock).mockReturnValue('mocked-uuid-no-ext');
        const file = { name: 'test-file' } as File;
        const result = getObjectKey(file);
        expect(result).toBe('mocked-uuid-no-ext');
        expect(randomUUID).toHaveBeenCalledTimes(1);
    });
});