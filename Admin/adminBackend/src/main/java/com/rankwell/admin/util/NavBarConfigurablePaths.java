package com.rankwell.admin.util;

import java.util.List;
import java.util.Set;

/**
 * Public-site nav items (excluding Home) that may be hidden via admin settings.
 * Must stay in sync with {@code User/client/src/menu.js} configurable links.
 */
public final class NavBarConfigurablePaths {

	private NavBarConfigurablePaths() {
	}

	public static final Set<String> ALLOWED = Set.copyOf(List.of(
			"/platform",
			"/solution",
			"/career",
			"/gallery",
			"/about",
			"/our-team",
			"/contact"));
}
