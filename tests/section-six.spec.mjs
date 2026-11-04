// Legacy Section 6 RSVP tests were migrated to Section 9 after the reference
// revealed its actual order: Dress Code = 6, Gallery = 7, Wedding Gift = 8,
// RSVP & Wishes = 9. Kept this guard to prevent accidental reversion.
import {test,expect} from '@playwright/test';
test('legacy RSVP is no longer mislabeled as Section 6 or 7',async({page})=>{
  await page.goto('/');
  const section=page.locator('#rsvp');
  await expect(section).toHaveAttribute('data-section','9');
  await expect(page.locator('#rsvpHeading')).toHaveText('RSVP & Wishes');
  await expect(page.locator('#s9RsvpForm')).toHaveCount(1);
  await expect(page.locator('#rsvpForm')).toHaveCount(0);
});
