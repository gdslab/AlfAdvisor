export default function ResearchGroupDoc() {
    /* ---------- palette & tokens ---------- */
    const brand = "#2a7d45";
    const text = "#222";
    const subtleText = "#555";
    const cardShadow =
        "0 3px 8px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)";

    /* ---------- layout wrapper ---------- */
    const wrap = {
        maxWidth: 800,
        margin: "2.5rem auto",
        padding: "2rem 2.25rem",
        background: "#fff",
        borderRadius: 12,
        boxShadow: cardShadow,
        fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        color: text,
        lineHeight: 1.65,
    };

    /* ---------- headings ---------- */
    const h1 = {
        fontSize: "2.25rem",
        color: brand,
        margin: 0,
        letterSpacing: "-0.5px",
    };

    const h2 = {
        fontSize: "1.35rem",
        color: brand,
        margin: "1.75rem 0 0.75rem",
        borderLeft: "4px",
        paddingLeft: "0.6rem",
    };

    /* ---------- lists & items ---------- */
    const ul = {
        paddingLeft: "1.4rem",
        marginTop: "0.5rem",
    };

    const li = {
        marginBottom: "0.4rem",
    };

    /* ---------- links ---------- */
    const link = {
        color: brand,
        textDecoration: "none",
    };

    const p = { marginTop: "0.6rem", color: subtleText };

    return (
        <div style={wrap}>
            <h1 style={h1}>Research Group</h1>

            <h2 style={h2}>Principal Investigator</h2>
            <li style={li}>
                Zhou&nbsp;Zhang, UW-Madison —{" "}
                <a href="mailto:zzhang347@wisc.edu" style={link}>
                    zzhang347@wisc.edu
                </a>
            </li>

            <h2 style={h2}>Co-Principal Investigators</h2>
            <ul style={ul}>
                <li style={li}>
                    Matthew&nbsp;Digman —{" "}
                    <a href="mailto:digman@wisc.edu" style={link}>
                        digman@wisc.edu
                    </a>
                </li>
                <li style={li}>
                    Jerome&nbsp;Cherney —{" "}
                    <a href="mailto:jhc5@cornell.edu" style={link}>
                        jhc5@cornell.edu
                    </a>
                </li>
                <li style={li}>
                    Paul&nbsp;Mitchell —{" "}
                    <a href="mailto:pdmitchell@wisc.edu" style={link}>
                        pdmitchell@wisc.edu
                    </a>
                </li>
                <li style={li}>
                    Jinha&nbsp;Jung —{" "}
                    <a href="mailto:jinha@purdue.edu" style={link}>
                        jinha@purdue.edu
                    </a>
                </li>
            </ul>

            <h2 style={h2}>Team Members</h2>
            <ul style={ul}>
                <li style={li}>
                    Nicholas&nbsp;Gallagher —{" "}
                    <a href="mailto:njg@umn.edu" style={link}>
                        njg@umn.edu
                    </a>
                </li>
                <li style={li}>
                    Jiang&nbsp;Chen —{" "}
                    <a href="mailto:jchen2363@wisc.edu" style={link}>
                        jchen2363@wisc.edu
                    </a>
                </li>
                <li style={li}>
                    Fatemeh&nbsp;Azimi —{" "}
                    <a href="mailto:fazimi@purdue.edu" style={link}>
                        fazimi@purdue.edu
                    </a>
                </li>
                <li style={li}>
                    Tong&nbsp;Yu —{" "}
                    <a href="mailto:tyu226@wisc.edu" style={link}>
                        tyu226@wisc.edu
                    </a>
                </li>
                <li style={li}>Diana&nbsp;Fares</li>
            </ul>


            <h2 style={h2}>Related Publications</h2>
            <ul style={ul}>
                <li style={li}>
                    Cherney&nbsp;J., Zhang&nbsp;Z., Jung&nbsp;J., Mitchell&nbsp;P., &amp;
                    Digman&nbsp;M. (2024). <em>Alf Advisor: A program to assist with
                        alfalfa harvest management decisions.</em>
                </li>
                <li style={li}>
                    Chen&nbsp;J., &amp; Zhang&nbsp;Z. (2023). An improved fusion of
                    Landsat-7/8, Sentinel-2, and Sentinel-1 data for monitoring alfalfa:
                    Implications for crop remote sensing. <em>International&nbsp;Journal of
                        Applied Earth Observation and Geoinformation, 124, 103533</em>.
                </li>
                <li style={li}>
                    Chen&nbsp;J., Yu&nbsp;T., Cherney&nbsp;J.&nbsp;H., &amp; Zhang&nbsp;Z.
                    (2024). Optimal integration of optical and SAR data for improving
                    alfalfa yield and quality traits prediction: new insights into
                    satellite-based forage crop monitoring. <em>Remote Sensing, 16(5), 734</em>.
                </li>
                <li style={li}>
                    Yu&nbsp;T., Xu&nbsp;Y., Zhou&nbsp;J., &amp; Zhang&nbsp;Z. (2025).
                    Pre-harvest estimation and contribution analysis of alfalfa quality
                    traits using multi-type features and machine learning. <em>International
                        Journal of Remote Sensing</em>, 1–32.&nbsp;
                    <a
                        href="https://doi.org/10.1080/01431161.2025.2505248"
                        style={link}
                    >
                        https://doi.org/10.1080/01431161.2025.2505248
                    </a>
                </li>
            </ul>
        </div>
    );
}
