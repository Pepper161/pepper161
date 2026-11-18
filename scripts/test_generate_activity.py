from datetime import date, timedelta
import unittest
import xml.etree.ElementTree as ET
from generate_activity import parse_counts, render_svg


class ActivityTests(unittest.TestCase):
    def test_incomplete_or_unknown_calendar_is_rejected(self):
        day = date(2026, 1, 1)
        cell = '<td data-date="2026-01-01" id="contribution-day-component-1"></td>'
        with self.assertRaises(ValueError):
            parse_counts(cell, day, day)
        with self.assertRaises(ValueError):
            parse_counts(cell + '<tool-tip for="contribution-day-component-1">Unexpected count</tool-tip>', day, day)

    def test_zero_and_comma_counts_are_parsed_without_relative_color(self):
        first = date(2026, 1, 1)
        source = '<td data-date="2026-01-01" id="contribution-day-component-1"></td><td data-date="2026-01-02" id="contribution-day-component-2"></td><tool-tip for="contribution-day-component-1">No contributions on January 1st.</tool-tip><tool-tip for="contribution-day-component-2">1,234 contributions on January 2nd.</tool-tip>'
        self.assertEqual(list(parse_counts(source, first, first + timedelta(days=1)).values()), [0, 1234])
        with self.assertRaises(ValueError):
            parse_counts(source + '<td data-date="2026-01-01" id="contribution-day-component-3"></td>', first, first)

    def test_a_spike_does_not_change_another_days_color_in_either_theme(self):
        day = date(2026, 1, 1)
        for theme in ("light", "dark"):
            def first_color(spike):
                svg = ET.fromstring(render_svg({day: 1, day + timedelta(days=1): spike}, theme, day))
                return next(node.attrib["fill"] for node in svg.iter() if node.attrib.get("data-date") == day.isoformat())
            self.assertEqual(first_color(2), first_color(10000))


if __name__ == "__main__":
    unittest.main()
