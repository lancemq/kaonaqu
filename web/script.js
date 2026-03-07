class KaonaquApp {
    constructor() {
        this.districts = [];
        this.schools = [];
        this.policies = [];
        this.news = [];
        this.activeDistrict = 'all';
        this.searchQuery = '';
    }

    async init() {
        try {
            this.assertSupportedAccessMode();
            await this.loadData();
            this.bindEvents();
            this.render();
        } catch (error) {
            this.showFatalError(error);
        }
    }

    assertSupportedAccessMode() {
        if (window.location.protocol === 'file:') {
            throw new Error('检测到你是直接打开 HTML 文件。请先在项目根目录运行 `npm start`，然后通过 http://localhost:8080 访问页面。');
        }
    }

    async loadData() {
        const [districts, schools, policies, news] = await Promise.all([
            this.fetchJson('/api/districts'),
            this.fetchJson('/api/schools'),
            this.fetchJson('/api/policies'),
            this.fetchJson('/api/news')
        ]);

        this.districts = districts;
        this.schools = schools;
        this.policies = policies;
        this.news = news;
    }

    async fetchJson(url) {
        let response;
        try {
            response = await fetch(url);
        } catch (error) {
            throw new Error(`无法请求 ${url}。请确认本地服务已启动，并使用 http://localhost:8080 访问页面。`);
        }

        if (!response.ok) {
            let detail = '';
            try {
                const payload = await response.json();
                detail = payload.error ? `，错误信息：${payload.error}` : '';
            } catch (error) {
                detail = '';
            }
            throw new Error(`请求失败: ${url}，状态码 ${response.status}${detail}`);
        }

        return response.json();
    }

    bindEvents() {
        const districtFilter = document.getElementById('district-filter');
        const searchInput = document.getElementById('search-input');
        const resetButton = document.getElementById('reset-filters');
        const searchTrigger = document.getElementById('search-trigger');
        const quickChips = document.querySelectorAll('[data-query]');

        districtFilter.addEventListener('change', (event) => {
            this.activeDistrict = event.target.value;
            this.render();
        });

        searchInput.addEventListener('input', (event) => {
            this.searchQuery = event.target.value.trim().toLowerCase();
            this.render();
        });

        searchInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                document.getElementById('schools').scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });

        searchTrigger.addEventListener('click', () => {
            this.searchQuery = searchInput.value.trim().toLowerCase();
            this.render();
            document.getElementById('schools').scrollIntoView({ behavior: 'smooth', block: 'start' });
        });

        resetButton.addEventListener('click', () => {
            this.activeDistrict = 'all';
            this.searchQuery = '';
            districtFilter.value = 'all';
            searchInput.value = '';
            this.render();
        });

        quickChips.forEach((button) => {
            button.addEventListener('click', () => {
                const query = button.dataset.query || '';
                this.searchQuery = query.toLowerCase();
                searchInput.value = query;
                this.render();
                document.getElementById('schools').scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        });
    }

    getSchoolDistrictId(school) {
        return school.districtId || this.mapDistrictNameToId(school.district || school.districtName);
    }

    getSchoolDistrictName(school) {
        return school.district || school.districtName || '未知区域';
    }

    getSchoolType(school) {
        return school.type || school.schoolTypeLabel || '未分类';
    }

    getSchoolStage(school) {
        return school.schoolStageLabel || (school.schoolStage === 'junior' ? '初中' : '高中');
    }

    getSchoolFeatures(school) {
        return school.keyFeatures || school.features || [];
    }

    getSchoolTags(school) {
        return school.tags || [];
    }

    getSchoolAdmissionInfo(school) {
        return school.admissionInfo || school.admissionNotes || '暂无';
    }

    getSchoolFeatureTags(school) {
        const tags = [...this.getSchoolTags(school), ...this.getSchoolFeatures(school)];
        return tags.slice(0, 4);
    }

    getFilteredSchools() {
        return this.schools.filter((school) => {
            const districtMatched = this.activeDistrict === 'all' || this.getSchoolDistrictId(school) === this.activeDistrict;
            if (!districtMatched) {
                return false;
            }

            if (!this.searchQuery) {
                return true;
            }

            const haystack = [
                school.name,
                this.getSchoolDistrictName(school),
                this.getSchoolStage(school),
                this.getSchoolType(school),
                school.tier,
                school.address,
                this.getSchoolAdmissionInfo(school),
                ...this.getSchoolFeatures(school),
                ...this.getSchoolTags(school)
            ].join(' ').toLowerCase();

            return haystack.includes(this.searchQuery);
        });
    }

    getFilteredPolicies() {
        return this.policies.filter((policy) => {
            const policyDistrict = policy.districtId || policy.district || 'all';
            return this.activeDistrict === 'all' || policyDistrict === 'all' || policyDistrict === this.activeDistrict;
        });
    }

    mapDistrictNameToId(name) {
        const district = this.districts.find((item) => item.name === name || item.districtName === name);
        return district ? district.id : name;
    }

    render() {
        const schools = this.getFilteredSchools();
        const policies = this.getFilteredPolicies();

        this.renderDistrictFilter();
        this.renderNews();
        this.renderDistricts();
        this.renderSchools(schools);
        this.renderPolicies(policies);
        this.renderStats(schools.length, policies.length);
        this.renderResultSummary(schools.length, policies.length);
    }

    renderDistrictFilter() {
        const select = document.getElementById('district-filter');
        const options = [
            '<option value="all">全部区域</option>',
            ...this.districts.map((district) => `<option value="${district.id}">${district.name || district.districtName}</option>`)
        ];

        select.innerHTML = options.join('');
        select.value = this.activeDistrict;
    }

    renderDistricts() {
        const container = document.getElementById('district-list');
        container.innerHTML = this.districts.map((district) => {
            const activeClass = this.activeDistrict === district.id ? ' district-card-active' : '';
            const name = district.name || district.districtName;
            const count = district.schoolCount || district.count || 0;
            const policyCount = district.policyCount || 0;
            const latestPolicyTitle = district.latestPolicyTitle || '';
            return `
                <button class="district-card${activeClass}" data-district-id="${district.id}" type="button">
                    <div class="district-card-header">
                        <h3>${name}</h3>
                        <span>${count} 所学校</span>
                    </div>
                    <p>${district.description || '暂无说明'}</p>
                    <p class="district-meta">政策 ${policyCount} 条${latestPolicyTitle ? ` · 最新：${latestPolicyTitle}` : ''}</p>
                </button>
            `;
        }).join('');

        container.querySelectorAll('[data-district-id]').forEach((button) => {
            button.addEventListener('click', () => {
                this.activeDistrict = button.dataset.districtId;
                document.getElementById('district-filter').value = this.activeDistrict;
                this.render();
            });
        });
    }

    renderNews() {
        const container = document.getElementById('news-list');
        if (!container) {
            return;
        }

        if (!this.news.length) {
            container.innerHTML = this.getEmptyState();
            return;
        }

        const items = [...this.news]
            .sort((left, right) => String(right.publishedAt || '').localeCompare(String(left.publishedAt || '')))
            .slice(0, 6);

        container.innerHTML = items.map((item) => `
            <article class="news-card">
                <div class="news-card-header">
                    <div class="news-meta-row">
                        <span class="pill">${item.category}</span>
                        <span class="news-date">${item.publishedAt || '暂无日期'}</span>
                    </div>
                    <h3>${item.title}</h3>
                </div>
                <p class="news-summary">${item.summary || '暂无摘要'}</p>
                <p class="news-source">来源：${item.source?.name || '未知'} · 可信度 ${this.formatConfidence(item.source?.confidence)}</p>
                ${item.source?.url ? `<a class="text-link" href="${item.source.url}" target="_blank" rel="noreferrer">查看原文</a>` : ''}
            </article>
        `).join('');
    }

    renderSchools(schools) {
        const container = document.getElementById('school-list');
        if (!schools.length) {
            container.innerHTML = this.getEmptyState();
            return;
        }

        container.innerHTML = schools.map((school) => `
            <article class="school-card">
                <div class="school-card-header">
                    <div>
                        <h3>${school.name}</h3>
                        <p>${this.getSchoolDistrictName(school)}</p>
                    </div>
                    <span class="pill">${this.getSchoolStage(school)} · ${this.getSchoolType(school)}</span>
                </div>
                <p class="school-summary">${this.getSchoolAdmissionInfo(school)}</p>
                <div class="school-highlights">
                    ${this.getSchoolFeatureTags(school).map((feature) => `<span class="meta-chip">${feature}</span>`).join('') || '<span class="meta-chip meta-chip-muted">暂无特色标签</span>'}
                </div>
                <details class="school-details">
                    <summary>查看详细信息</summary>
                    <dl class="school-meta">
                        <div>
                            <dt>梯队</dt>
                            <dd>${school.tier ? `${school.tier} 梯队` : '暂无'}</dd>
                        </div>
                        <div>
                            <dt>地址</dt>
                            <dd>${school.address || '暂无'}</dd>
                        </div>
                        <div>
                            <dt>电话</dt>
                            <dd>${school.phone || '暂无'}</dd>
                        </div>
                        <div>
                            <dt>完整特色</dt>
                            <dd>${this.getSchoolFeatures(school).join('、') || '暂无'}</dd>
                        </div>
                        <div>
                            <dt>标签</dt>
                            <dd>${this.getSchoolTags(school).join('、') || '暂无'}</dd>
                        </div>
                        <div>
                            <dt>来源</dt>
                            <dd>${school.source?.name || '未知'} · 可信度 ${this.formatConfidence(school.source?.confidence)}</dd>
                        </div>
                        <div>
                            <dt>抓取时间</dt>
                            <dd>${school.source?.crawledAt || '暂无'}</dd>
                        </div>
                    </dl>
                    ${school.website ? `<a class="text-link" href="${school.website}" target="_blank" rel="noreferrer">查看学校网站</a>` : ''}
                </details>
            </article>
        `).join('');
    }

    renderPolicies(policies) {
        const container = document.getElementById('policy-list');
        if (!policies.length) {
            container.innerHTML = this.getEmptyState();
            return;
        }

        container.innerHTML = policies.map((policy) => `
            <article class="policy-card">
                <div class="policy-card-header">
                    <h3>${policy.title}</h3>
                    <span class="pill">${policy.districtName || policy.district || '全市'}</span>
                </div>
                <p class="policy-summary">${policy.summary || '暂无摘要'}</p>
                <p class="policy-meta">${policy.year || ''}${policy.publishedAt ? ` | ${policy.publishedAt}` : ''}</p>
                <p class="policy-content">${policy.content || ''}</p>
                <p class="policy-source">来源：${policy.source?.name || '未知'} · 可信度 ${this.formatConfidence(policy.source?.confidence)}</p>
            </article>
        `).join('');
    }

    formatConfidence(value) {
        const score = typeof value === 'number' ? value : 0;
        return `${Math.round(score * 100)}%`;
    }

    renderStats(schoolCount, policyCount) {
        document.getElementById('school-count').textContent = String(schoolCount);
        document.getElementById('policy-count').textContent = String(policyCount);
    }

    renderResultSummary(schoolCount, policyCount) {
        const districtName = this.activeDistrict === 'all'
            ? '全上海'
            : (this.districts.find((district) => district.id === this.activeDistrict)?.name || this.activeDistrict);
        const queryLabel = this.searchQuery ? `关键词“${this.searchQuery}”` : '全部关键词';
        document.getElementById('result-summary').textContent =
            `当前范围：${districtName}，匹配 ${schoolCount} 所学校，关联 ${policyCount} 条政策，搜索条件为 ${queryLabel}。`;
    }

    getEmptyState() {
        return document.getElementById('empty-state-template').innerHTML;
    }

    showFatalError(error) {
        document.body.innerHTML = `
            <div class="fatal-error">
                <h1>页面初始化失败</h1>
                <p>请检查本地服务是否启动，以及数据文件是否可读取。</p>
                <pre>${error.message}</pre>
            </div>
        `;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new KaonaquApp();
    app.init();
});
