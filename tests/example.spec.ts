import { test, expect } from '@playwright/test';
import { stagehand } from '@browserbasehq/stagehand';

/**
 * This test file demonstrates how to use Stagehand with Playwright
 * for AI-powered browser automation.
 * 
 * Stagehand allows you to describe browser interactions in natural language
 * and have an AI model execute them intelligently.
 */

test.describe('Stagehand Examples', () => {
  
  test('should navigate and interact with the home page', async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
    
    // Take a screenshot for reference
    await page.screenshot({ path: 'homepage.png' });
    
    // Use Stagehand to analyze the page and perform actions
    // This demonstrates how to use Stagehand's AI capabilities to interact with the UI
    await stagehand(page, 'Look at the page and describe what you see');
    
    // Example of a more specific instruction to Stagehand
    const title = await stagehand(page, 'Find and return the main title of the page');
    console.log('Page title found by Stagehand:', title);
    
    // Verify the page contains expected elements
    expect(page.url()).toContain('localhost:5173');
    expect(await page.title()).not.toBe('');
  });
  
  test('should fill out a form using Stagehand', async ({ page }) => {
    await page.goto('/');
    
    // Use Stagehand to find and interact with a form
    // This shows how Stagehand can handle complex interactions
    await stagehand(page, `
      Find a form or input field on the page.
      If you find a search field, enter "test contact" and submit the form.
      If you find a login form, enter "user@example.com" in the email field
      and "password123" in the password field, but don't submit it.
    `);
    
    // Take a screenshot after Stagehand has performed actions
    await page.screenshot({ path: 'form-interaction.png' });
    
    // Conventional Playwright assertions can be used alongside Stagehand
    // This demonstrates the hybrid approach of using both tools
    const url = page.url();
    console.log('Current URL after Stagehand interaction:', url);
  });
  
  test('should perform a complex workflow using Stagehand', async ({ page }) => {
    await page.goto('/');
    
    // Stagehand can follow complex multi-step instructions
    // This demonstrates its ability to handle sophisticated user journeys
    const result = await stagehand(page, `
      1. Look for a "Contact" or similar navigation link and click it
      2. If you're taken to a contacts page, look for an "Add Contact" button and click it
      3. If a form appears, fill it out with:
         - Name: John Doe
         - Email: john@example.com
         - Phone: 555-123-4567
      4. Look for a "Save" or "Submit" button and click it
      5. Return the text of any confirmation message you see
    `);
    
    console.log('Result of complex workflow:', result);
    
    // Example of how to check the results of Stagehand's actions
    await page.screenshot({ path: 'complex-workflow-result.png' });
  });
});

