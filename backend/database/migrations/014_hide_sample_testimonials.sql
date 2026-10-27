-- The home page's "What Our Customers Say" sample testimonials are hidden until real reviews come in;
-- the section shows "No reviews yet" meanwhile. Soft-deleted, so they can be restored from the table.
-- Safe to re-run.

UPDATE `testimonials` SET `is_active` = 0, `is_delete` = 1 WHERE `is_delete` = 0;
