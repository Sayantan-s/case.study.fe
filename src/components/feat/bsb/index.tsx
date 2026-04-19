import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import styles from "./bsb.module.css";

const HARDCODED = {
  skills: [
    "React",
    "Angular",
    "Vue.js",
    "Node.js",
    "Python",
    "Java",
    "TypeScript",
    "Go",
    "Rust",
    "Swift",
    "Kotlin",
    "Ruby on Rails",
    "Django",
    "Flask",
    "Spring Boot",
    "GraphQL",
    "REST APIs",
    "AWS",
    "GCP",
    "Azure",
    "Docker",
    "Kubernetes",
    "Terraform",
    "CI/CD",
    "PostgreSQL",
    "MongoDB",
    "Redis",
    "Kafka",
    "System Design",
    "Data Structures",
    "Machine Learning",
    "Deep Learning",
    "NLP",
    "Computer Vision",
    "Figma",
    "Product Management",
    "Agile",
    "Scrum",
    "SQL",
    "NoSQL",
    "Elasticsearch",
    "React Native",
    "Flutter",
    "iOS",
    "Android",
    "DevOps",
    "SRE",
    "Microservices",
  ],
  roles: [
    "Software Engineer",
    "Senior Software Engineer",
    "Staff Engineer",
    "Principal Engineer",
    "Frontend Engineer",
    "Backend Engineer",
    "Full Stack Engineer",
    "DevOps Engineer",
    "SRE",
    "Data Engineer",
    "Data Scientist",
    "ML Engineer",
    "AI Engineer",
    "iOS Developer",
    "Android Developer",
    "Mobile Engineer",
    "Engineering Manager",
    "Director of Engineering",
    "VP Engineering",
    "CTO",
    "Product Manager",
    "Senior Product Manager",
    "Product Designer",
    "UX Designer",
    "UI Engineer",
    "QA Engineer",
    "SDET",
    "Solutions Architect",
    "Cloud Architect",
    "Tech Lead",
  ],
  locations: {
    Metro: ["Bangalore", "Mumbai", "Delhi NCR", "Hyderabad", "Chennai", "Pune"],
    "Tier 2": ["Ahmedabad", "Kolkata", "Jaipur", "Lucknow", "Kochi", "Chandigarh", "Indore"],
    Global: ["San Francisco", "New York", "London", "Singapore", "Berlin", "Toronto", "Dubai"],
    Other: ["Remote – India", "Remote – Global", "Hybrid"],
  },
  types: ["IC", "IC + Manager", "Manager"],
  experience: ["0-2 yrs", "2-5 yrs", "5-8 yrs", "8-12 yrs", "12+ yrs"],
};

const TEMPLATES = [
  {
    name: "Senior React – Metro",
    skills: ["React", "TypeScript"],
    roles: ["Senior Software Engineer", "Staff Engineer"],
    locs: ["Bangalore", "Hyderabad", "Pune"],
    types: ["IC"],
    exp: ["5-8 yrs", "8-12 yrs"],
  },
  {
    name: "Backend Lead – Remote",
    skills: ["Node.js", "System Design", "AWS"],
    roles: ["Tech Lead", "Staff Engineer"],
    locs: ["Remote – India"],
    types: ["IC", "IC + Manager"],
    exp: ["8-12 yrs", "12+ yrs"],
  },
  {
    name: "ML Engineer – Global",
    skills: ["Python", "Machine Learning", "Deep Learning"],
    roles: ["ML Engineer", "AI Engineer", "Data Scientist"],
    locs: ["San Francisco", "London", "Bangalore", "Singapore"],
    types: ["IC"],
    exp: ["2-5 yrs", "5-8 yrs"],
  },
  {
    name: "Mobile Dev – India",
    skills: ["React Native", "Flutter", "iOS", "Android"],
    roles: ["Mobile Engineer", "iOS Developer", "Android Developer"],
    locs: ["Bangalore", "Mumbai", "Delhi NCR", "Hyderabad"],
    types: ["IC"],
    exp: ["2-5 yrs", "5-8 yrs"],
  },
];

// Fonts
const fontLink = document.createElement("link");
fontLink.href =
  "https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=JetBrains+Mono:wght@400;500&display=swap";
fontLink.rel = "stylesheet";
document.head.appendChild(fontLink);

// ─── Chip ───
function Chip({
  label,
  onRemove,
  excluded,
  onToggleExclude,
  color,
}: {
  label: string;
  onRemove: () => void;
  excluded?: boolean;
  onToggleExclude?: (() => void) | null;
  color?: string;
}) {
  const chipClass = excluded ? styles.chipExcluded : styles.chipDefault;
  const btnClass = excluded ? styles.chipBtnExcluded : styles.chipBtnDefault;

  return (
    <span className={chipClass} style={!excluded && color ? { background: color } : undefined}>
      {excluded && <span className={styles.chipNotBadge}>NOT</span>}
      {label}
      {onToggleExclude && (
        <button
          onClick={onToggleExclude}
          title={excluded ? "Include" : "Exclude"}
          className={`${btnClass} ${styles.chipToggleBtn}`}
        >
          {excluded ? "↩" : "⊘"}
        </button>
      )}
      <button onClick={onRemove} className={`${btnClass} ${styles.chipRemoveBtn}`}>
        ×
      </button>
    </span>
  );
}

// ─── Autocomplete Dropdown ───
function AutoComplete({
  options,
  selected,
  onSelect,
  placeholder,
  inputRef: externalRef,
}: {
  options: string[];
  selected: { label: string }[];
  onSelect: (value: string) => void;
  placeholder?: string;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const localRef = useRef<HTMLInputElement>(null);
  const ref = externalRef || localRef;
  const dropRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const s = new Set(selected.map((i) => i.label));
    return options
      .filter((o) => !s.has(o) && o.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 12);
  }, [options, selected, query]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropRef.current &&
        !dropRef.current.contains(e.target as Node) &&
        ref.current !== e.target
      )
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && query.trim()) {
      e.preventDefault();
      const match = filtered[0];
      if (match) {
        onSelect(match);
        setQuery("");
      } else if (query.trim().length > 1) {
        onSelect(query.trim());
        setQuery("");
      }
    }
    if (e.key === "Escape") setOpen(false);
  };

  return (
    <div className={styles.autocompleteWrapper}>
      <input
        ref={ref}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKey}
        placeholder={placeholder}
        className={styles.autocompleteInput}
      />
      {open && filtered.length > 0 && (
        <div ref={dropRef} className={styles.dropdown}>
          {filtered.map((opt) => (
            <div
              key={opt}
              onClick={() => {
                onSelect(opt);
                setQuery("");
                setOpen(false);
              }}
              className={styles.dropdownItem}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Filter Lane ───
function FilterLane({
  title,
  icon,
  items,
  onAdd,
  onRemove,
  options,
  placeholder,
  matchMode,
  onMatchModeChange,
  showMatchToggle,
  onToggleExclude,
  color,
  children,
}: {
  title: string;
  icon: string;
  items: { label: string; excluded?: boolean }[];
  onAdd: (label: string) => void;
  onRemove: (label: string) => void;
  options: string[];
  placeholder?: string;
  matchMode?: string;
  onMatchModeChange?: () => void;
  showMatchToggle?: boolean;
  onToggleExclude?: (label: string) => void;
  color?: string;
  children?: React.ReactNode;
}) {
  const hasContent = items.length > 0 || children;
  const headerClass = hasContent ? styles.filterLaneHeaderWithContent : styles.filterLaneHeader;

  return (
    <div className={styles.filterLane}>
      <div className={headerClass}>
        <div className={styles.filterLaneTitleGroup}>
          <span className={styles.filterLaneIcon}>{icon}</span>
          <span className={styles.filterLaneTitle}>{title}</span>
        </div>
        <div className={styles.filterLaneActions}>
          {showMatchToggle && items.length > 1 && (
            <button
              onClick={onMatchModeChange}
              className={
                matchMode === "any" ? styles.matchModeBtnAny : styles.matchModeBtnAll
              }
            >
              {matchMode === "any" ? "ANY (OR)" : "ALL (AND)"}
            </button>
          )}
        </div>
      </div>
      {items.length > 0 && (
        <div className={styles.chipsContainer}>
          {items.map((item, i) => (
            <Chip
              key={item.label + i}
              label={item.label}
              excluded={item.excluded}
              onRemove={() => onRemove(item.label)}
              onToggleExclude={onToggleExclude ? () => onToggleExclude(item.label) : null}
              color={color}
            />
          ))}
        </div>
      )}
      {children ? (
        children
      ) : (
        <AutoComplete
          options={options}
          selected={items}
          onSelect={onAdd}
          placeholder={placeholder}
        />
      )}
    </div>
  );
}

// ─── Location picker with groups ───
function LocationPicker({
  items,
  onAdd,
  onRemove,
  onToggleExclude,
}: {
  items: { label: string; excluded?: boolean }[];
  onAdd: (label: string) => void;
  onRemove: (label: string) => void;
  onToggleExclude: (label: string) => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const selected = new Set(items.map((i) => i.label));

  return (
    <div>
      {items.length > 0 && (
        <div className={styles.chipsContainer}>
          {items.map((item, i) => (
            <Chip
              key={item.label + i}
              label={item.label}
              excluded={item.excluded}
              onRemove={() => onRemove(item.label)}
              onToggleExclude={() => onToggleExclude(item.label)}
            />
          ))}
        </div>
      )}
      <div className={styles.locationGroups}>
        {Object.entries(HARDCODED.locations).map(([group, locs]) => (
          <div key={group} style={{ position: "relative" }}>
            <button
              onClick={() => setExpanded(expanded === group ? null : group)}
              className={
                expanded === group ? styles.locationGroupBtnExpanded : styles.locationGroupBtn
              }
            >
              {group} ▾
            </button>
            {expanded === group && (
              <div className={styles.locationDropdown}>
                <div
                  onClick={() => {
                    locs.forEach((l) => {
                      if (!selected.has(l)) onAdd(l);
                    });
                    setExpanded(null);
                  }}
                  className={styles.locationSelectAll}
                >
                  Select all {group}
                </div>
                {locs.map((loc) => (
                  <div
                    key={loc}
                    onClick={() => {
                      if (!selected.has(loc)) {
                        onAdd(loc);
                      }
                      setExpanded(null);
                    }}
                    className={
                      selected.has(loc)
                        ? styles.locationOptionSelected
                        : styles.locationOptionAvailable
                    }
                  >
                    {selected.has(loc) ? "✓ " : ""}
                    {loc}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Toggle group for contributor type / experience ───
function ToggleGroup({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className={styles.toggleGroup}>
      {options.map((opt) => {
        const active = selected.includes(opt);
        return (
          <button
            key={opt}
            onClick={() => onToggle(opt)}
            className={active ? styles.toggleBtnActive : styles.toggleBtnInactive}
          >
            {active && "✓ "}
            {opt}
          </button>
        );
      })}
    </div>
  );
}

// ─── Boolean Query Builder ───
function buildQuery(state: {
  skills: { items: { label: string; excluded?: boolean }[]; matchMode: string };
  roles: { items: { label: string; excluded?: boolean }[]; matchMode: string };
  locations: { items: { label: string; excluded?: boolean }[] };
  types: string[];
  experience: string[];
}) {
  const parts: string[] = [];
  const fmt = (
    lane: { items: { label: string; excluded?: boolean }[]; matchMode: string },
    key: string,
  ) => {
    const included = lane.items.filter((i) => !i.excluded);
    const excluded = lane.items.filter((i) => i.excluded);
    const inc = included.map((i) => `${key}:"${i.label}"`);
    const exc = excluded.map((i) => `NOT ${key}:"${i.label}"`);
    let result = "";
    if (inc.length > 0) {
      const joiner = lane.matchMode === "all" ? " AND " : " OR ";
      result = inc.length > 1 ? `(${inc.join(joiner)})` : inc[0];
    }
    if (exc.length > 0) {
      const excStr = exc.join(" AND ");
      result = result ? `${result} AND ${excStr}` : excStr;
    }
    return result;
  };

  const s = fmt(state.skills, "skill");
  const r = fmt(state.roles, "role");

  const locIncluded = state.locations.items.filter((i) => !i.excluded);
  const locExcluded = state.locations.items.filter((i) => i.excluded);
  let locStr = "";
  if (locIncluded.length) {
    const inner = locIncluded.map((i) => `loc:"${i.label}"`).join(" OR ");
    locStr = locIncluded.length > 1 ? `(${inner})` : inner;
  }
  if (locExcluded.length) {
    const excPart = locExcluded.map((i) => `NOT loc:"${i.label}"`).join(" AND ");
    locStr = locStr ? `${locStr} AND ${excPart}` : excPart;
  }

  const types =
    state.types.length > 0
      ? state.types.length > 1
        ? `(${state.types.map((t) => `type:"${t}"`).join(" OR ")})`
        : `type:"${state.types[0]}"`
      : "";

  const exp =
    state.experience.length > 0
      ? state.experience.length > 1
        ? `(${state.experience.map((e) => `exp:"${e}"`).join(" OR ")})`
        : `exp:"${state.experience[0]}"`
      : "";

  [s, r, locStr, types, exp].forEach((p) => {
    if (p) parts.push(p);
  });
  return parts.join(" AND ") || "No filters applied";
}

function candidateCount(state: {
  skills: { items: { label: string; excluded?: boolean }[]; matchMode: string };
  roles: { items: { label: string; excluded?: boolean }[] };
  locations: { items: { label: string; excluded?: boolean }[] };
  types: string[];
  experience: string[];
}) {
  let base = 24850;
  const totalItems =
    state.skills.items.length +
    state.roles.items.length +
    state.locations.items.length +
    state.types.length +
    state.experience.length;
  if (totalItems === 0) return base;
  const excluded = [...state.skills.items, ...state.roles.items, ...state.locations.items].filter(
    (i) => i.excluded,
  ).length;
  let factor = 1;
  state.skills.items
    .filter((i) => !i.excluded)
    .forEach(() => {
      factor *= state.skills.matchMode === "all" ? 0.35 : 0.6;
    });
  state.roles.items
    .filter((i) => !i.excluded)
    .forEach(() => {
      factor *= 0.5;
    });
  state.locations.items
    .filter((i) => !i.excluded)
    .forEach((_, idx) => {
      factor *= idx === 0 ? 0.25 : 0.85;
    });
  state.types.forEach(() => {
    factor *= 0.7;
  });
  state.experience.forEach((_, idx) => {
    factor *= idx === 0 ? 0.5 : 0.9;
  });
  factor *= Math.pow(0.8, excluded);
  return Math.max(1, Math.round(base * factor));
}

// ─── AND Connector ───
function AndConnector() {
  return (
    <div className={styles.andConnector}>
      <div className={styles.andConnectorLine} />
      <span className={styles.andConnectorLabel}>AND</span>
      <div className={styles.andConnectorLine} />
    </div>
  );
}

// ─── Main App ───
export default function BooleanSearchBuilder() {
  const [state, setState] = useState({
    skills: { items: [] as { label: string; excluded: boolean }[], matchMode: "any" },
    roles: { items: [] as { label: string; excluded: boolean }[], matchMode: "any" },
    locations: { items: [] as { label: string; excluded: boolean }[] },
    types: [] as string[],
    experience: [] as string[],
  });
  const [showQuery, setShowQuery] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [animateCount, setAnimateCount] = useState(false);

  const count = useMemo(() => candidateCount(state), [state]);
  const query = useMemo(() => buildQuery(state), [state]);

  useEffect(() => {
    setAnimateCount(true);
    const t = setTimeout(() => setAnimateCount(false), 300);
    return () => clearTimeout(t);
  }, [count]);

  const addItem = useCallback((lane: "skills" | "roles" | "locations", label: string) => {
    setState((prev) => ({
      ...prev,
      [lane]: { ...prev[lane], items: [...prev[lane].items, { label, excluded: false }] },
    }));
  }, []);

  const removeItem = useCallback((lane: "skills" | "roles" | "locations", label: string) => {
    setState((prev) => ({
      ...prev,
      [lane]: { ...prev[lane], items: prev[lane].items.filter((i) => i.label !== label) },
    }));
  }, []);

  const toggleExclude = useCallback((lane: "skills" | "roles" | "locations", label: string) => {
    setState((prev) => ({
      ...prev,
      [lane]: {
        ...prev[lane],
        items: prev[lane].items.map((i) =>
          i.label === label ? { ...i, excluded: !i.excluded } : i,
        ),
      },
    }));
  }, []);

  const toggleMatchMode = useCallback((lane: "skills" | "roles") => {
    setState((prev) => ({
      ...prev,
      [lane]: { ...prev[lane], matchMode: prev[lane].matchMode === "any" ? "all" : "any" },
    }));
  }, []);

  const toggleType = useCallback((type: string) => {
    setState((prev) => ({
      ...prev,
      types: prev.types.includes(type)
        ? prev.types.filter((t) => t !== type)
        : [...prev.types, type],
    }));
  }, []);

  const toggleExp = useCallback((exp: string) => {
    setState((prev) => ({
      ...prev,
      experience: prev.experience.includes(exp)
        ? prev.experience.filter((e) => e !== exp)
        : [...prev.experience, exp],
    }));
  }, []);

  const applyTemplate = useCallback(
    (tpl: (typeof TEMPLATES)[number]) => {
      setState({
        skills: {
          items: tpl.skills.map((s) => ({ label: s, excluded: false })),
          matchMode: "any",
        },
        roles: { items: tpl.roles.map((r) => ({ label: r, excluded: false })), matchMode: "any" },
        locations: { items: tpl.locs.map((l) => ({ label: l, excluded: false })) },
        types: [...tpl.types],
        experience: [...tpl.exp],
      });
      setShowTemplates(false);
    },
    [],
  );

  const clearAll = useCallback(() => {
    setState({
      skills: { items: [], matchMode: "any" },
      roles: { items: [], matchMode: "any" },
      locations: { items: [] },
      types: [],
      experience: [],
    });
  }, []);

  const totalFilters =
    state.skills.items.length +
    state.roles.items.length +
    state.locations.items.length +
    state.types.length +
    state.experience.length;

  return (
    <div className={styles.root}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerRow}>
            <div className={styles.headerIcon}>⊞</div>
            <h1 className={styles.headerTitle}>Search Builder</h1>
          </div>
          <p className={styles.headerSubtitle}>
            Build precise candidate queries with smart filters
          </p>
        </div>

        {/* Quick Templates */}
        <div className={styles.templatesSection}>
          <button onClick={() => setShowTemplates(!showTemplates)} className={styles.templatesToggle}>
            ⚡ Quick Templates
            <span className={styles.templatesToggleArrow}>
              {showTemplates ? "▲" : "▼"}
            </span>
          </button>
          {showTemplates && (
            <div className={styles.templatesGrid}>
              {TEMPLATES.map((tpl) => (
                <button
                  key={tpl.name}
                  onClick={() => applyTemplate(tpl)}
                  className={styles.templateCard}
                >
                  <div className={styles.templateName}>{tpl.name}</div>
                  <div className={styles.templateMeta}>
                    {tpl.skills.slice(0, 2).join(", ")} · {tpl.locs.slice(0, 2).join(", ")}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Filter Lanes */}
        <div className={styles.filterLanesContainer}>
          <FilterLane
            title="Skills"
            icon="◈"
            placeholder="Search skills — e.g. React, Python, AWS…"
            items={state.skills.items}
            options={HARDCODED.skills}
            onAdd={(label) => addItem("skills", label)}
            onRemove={(label) => removeItem("skills", label)}
            onToggleExclude={(label) => toggleExclude("skills", label)}
            matchMode={state.skills.matchMode}
            onMatchModeChange={() => toggleMatchMode("skills")}
            showMatchToggle={true}
          />
          <AndConnector />
          <FilterLane
            title="Roles"
            icon="◉"
            placeholder="Search roles — e.g. Frontend Engineer, PM…"
            items={state.roles.items}
            options={HARDCODED.roles}
            onAdd={(label) => addItem("roles", label)}
            onRemove={(label) => removeItem("roles", label)}
            onToggleExclude={(label) => toggleExclude("roles", label)}
            matchMode={state.roles.matchMode}
            onMatchModeChange={() => toggleMatchMode("roles")}
            showMatchToggle={true}
          />
          <AndConnector />
          <FilterLane
            title="Locations"
            icon="◎"
            items={[]}
            options={[]}
            onAdd={() => {}}
            onRemove={() => {}}
          >
            <LocationPicker
              items={state.locations.items}
              onAdd={(label) => addItem("locations", label)}
              onRemove={(label) => removeItem("locations", label)}
              onToggleExclude={(label) => toggleExclude("locations", label)}
            />
          </FilterLane>
          <AndConnector />
          <FilterLane
            title="Contributor Type"
            icon="◆"
            items={[]}
            options={[]}
            onAdd={() => {}}
            onRemove={() => {}}
          >
            <ToggleGroup options={HARDCODED.types} selected={state.types} onToggle={toggleType} />
          </FilterLane>
          <AndConnector />
          <FilterLane
            title="Experience"
            icon="◇"
            items={[]}
            options={[]}
            onAdd={() => {}}
            onRemove={() => {}}
          >
            <ToggleGroup
              options={HARDCODED.experience}
              selected={state.experience}
              onToggle={toggleExp}
            />
          </FilterLane>
        </div>

        {/* Results bar */}
        <div className={styles.resultsBar}>
          <div className={styles.resultsInfo}>
            <span className={animateCount ? styles.resultsCountAnimated : styles.resultsCount}>
              {count.toLocaleString()}
            </span>
            <span className={styles.resultsLabel}>candidates match</span>
          </div>
          <div className={styles.resultsActions}>
            {totalFilters > 0 && (
              <button onClick={clearAll} className={styles.clearBtn}>
                Clear all
              </button>
            )}
            <button className={styles.searchBtn}>Search</button>
          </div>
        </div>

        {/* Boolean query toggle */}
        <div className={styles.querySection}>
          <button onClick={() => setShowQuery(!showQuery)} className={styles.queryToggle}>
            {showQuery ? "▼" : "▶"} View boolean query
          </button>
          {showQuery && <div className={styles.queryDisplay}>{query}</div>}
        </div>
      </div>
    </div>
  );
}
