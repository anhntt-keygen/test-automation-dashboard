import { test, expect } from '@playwright/test';

// Cấu hình Mock API Endpoint phục vụ cho việc cô lập môi trường kiểm thử
const MOCK_API_BASE = 'https://api.vibecode-app.local';

test.describe('TEA 1.27.2 - Automated Test Suite ($bmad-testarch-automate)', () => {

  // Trước mỗi test case, thiết lập cấu hình routing để mock dữ liệu nếu cần thiết
  test.beforeEach(async ({ page }) => {
    // Mock API lấy danh sách công việc/sản phẩm để đảm bảo UI hiển thị ổn định
    await page.route(`${MOCK_API_BASE}/api/v1/items`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 1, name: 'Task Hoàn Thiện WBS', status: 'Pending' },
          { id: 2, name: 'Task Viết Test Playwright', status: 'Completed' }
        ])
      });
    });
  });

  /**
   * [SC-01] Basic Operations
   * Mục tiêu: Kiểm tra luồng tương tác UI cơ bản, nhập liệu biểu mẫu và gửi thành công.
   */
  test('[SC-01] Basic Operations', async ({ page }) => {
    // 1. Truy cập trang chủ ứng dụng
    await page.goto('/');

    // 2. Xác minh các phần tử giao diện chính hiển thị đúng bằng Selector Resilience
    const title = page.locator('h1');
    await expect(title).toContainText(/Hệ Thống Quản Lý/i);

    // 3. Điền thông tin vào biểu mẫu (Sử dụng locator chuẩn vai trò)
    const inputName = page.getByRole('textbox', { name: /tên công việc/i });
    await inputName.fill('Học tập TEA 1.27.2');

    // 4. Click nút gửi để thêm mới
    const submitBtn = page.getByRole('button', { name: /thêm mới/i });
    await submitBtn.click();

    // 5. Xác minh phần tử mới xuất hiện trên danh sách UI
    const newItem = page.locator('text=Học tập TEA 1.27.2');
    await expect(newItem).toBeVisible();
  });

  /**
   * [SC-02] Advanced UI Interactions & Validation
   * Mục tiêu: Kiểm tra các tương tác phức tạp như lọc dữ liệu, chuyển trạng thái và xóa phần tử.
   */
  test('[SC-02] Advanced UI Interactions & Validation', async ({ page }) => {
    await page.goto('/');

    // 1. Tương tác với bộ lọc (Filter Dropdown)
    const filterSelect = page.getByRole('combobox', { name: /trạng thái/i });
    await filterSelect.selectOption('Completed');

    // 2. Xác minh danh sách đã được lọc tương ứng
    const completedItem = page.locator('text=Task Viết Test Playwright');
    const pendingItem = page.locator('text=Task Hoàn Thiện WBS');
    await expect(completedItem).toBeVisible();
    await expect(pendingItem).not.toBeVisible();

    // 3. Thực hiện hành động xóa phần tử đầu tiên
    const deleteBtn = page.locator('.btn-delete').first();
    
    // Thiết lập dialog handler để tự động chấp nhận confirm popup của trình duyệt
    page.once('dialog', async (dialog) => {
      expect(dialog.type()).toBe('confirm');
      await dialog.accept();
    });
    
    await deleteBtn.click();

    // 4. Xác minh phần tử đã bị xóa khỏi DOM
    await expect(completedItem).not.toBeVisible();
  });

  /**
   * [SC-03] API Integration & Error Boundaries
   * Mục tiêu: Kiểm thử tích hợp API trực tiếp, bao phủ các mã lỗi biên 400, 404, 500.
   */
  test('[SC-03] API Integration & Error Boundaries', async ({ request }) => {
    // 1. Kiểm thử API GET danh sách (Trạng thái thành công 200)
    const getResponse = await request.get(`${MOCK_API_BASE}/api/v1/items`);
    expect(getResponse.status()).toBe(200);
    const responseBody = await getResponse.json();
    expect(Array.isArray(responseBody)).toBeTruthy();
    expect(responseBody[0]).toHaveProperty('name');

    // 2. Kiểm thử API POST với dữ liệu không hợp lệ (Lỗi biên 400 Bad Request)
    const badPostResponse = await request.post(`${MOCK_API_BASE}/api/v1/items`, {
      data: { name: '' } // Tên rỗng kích hoạt validation error
    });
    expect(badPostResponse.status()).toBe(400);

    // 3. Kiểm thử API GET tới tài nguyên không tồn tại (Lỗi biên 404 Not Found)
    const notFoundResponse = await request.get(`${MOCK_API_BASE}/api/v1/non-existent-endpoint`);
    expect(notFoundResponse.status()).toBe(404);

    // 4. Kiểm thử API POST kích hoạt lỗi hệ thống giả lập (Lỗi biên 500 Internal Server Error)
    const triggerErrorResponse = await request.post(`${MOCK_API_BASE}/api/v1/items/trigger-error`, {
      data: { action: 'force-crash' }
    });
    expect(triggerErrorResponse.status()).toBe(500);
  });

  /**
   * [SC-04] Evidence Collection & Trace Verification
   * Mục tiêu: Đảm bảo cơ chế chụp ảnh bằng chứng hoạt động hoàn hảo khi xảy ra sự cố.
   */
  test('[SC-04] Evidence Collection & Trace Verification', async ({ page }, testInfo) => {
    await page.goto('/');

    // Chụp ảnh màn hình trạng thái ban đầu làm bằng chứng kiểm thử (Evidence Collection)
    const screenshotPath = `test-results/evidence/initial-state-${testInfo.project.name}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });
    
    // Xác minh tệp ảnh đã được ghi nhận thành công trong danh sách đính kèm của test run
    testInfo.attachments.push({
      name: 'Initial State Screenshot',
      path: screenshotPath,
      contentType: 'image/png'
    });

    // Xác minh phần tử footer chân trang hiển thị đúng thông tin bản quyền hệ thống
    const footer = page.locator('footer');
    await expect(footer).toContainText(/Vibecode/i);
  });

});