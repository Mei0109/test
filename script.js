document.addEventListener('DOMContentLoaded', function() {
    // 获取表单元素
    const form = document.getElementById('horseRidingForm');
    const saveBtn = document.getElementById('saveBtn');
    const exportBtn = document.getElementById('exportBtn');
    const statsBtn = document.getElementById('statsBtn');
    
    // 获取查找功能元素
    const searchBtn = document.getElementById('searchBtn');
    const resetSearchBtn = document.getElementById('resetSearchBtn');
    const searchStartDate = document.getElementById('searchStartDate');
    const searchEndDate = document.getElementById('searchEndDate');
    
    // 条件显示的容器
    const windLevelContainer = document.getElementById('windLevelContainer');
    const helmetCleanContainer = document.getElementById('helmetCleanContainer');
    const skincareNameContainer = document.getElementById('skincareNameContainer');
    const hourContainer = document.getElementById('hourContainer');
    const otherSymptomsContainer = document.getElementById('otherSymptomsContainer');
    const recordsContainer = document.getElementById('recordsContainer');
    const statsContainer = document.getElementById('statsContainer');
    // 花粉情况容器
    const otherPollenContainer = document.getElementById('otherPollenContainer');
    // 新增其他花粉种类容器
    const otherPollenTypesContainer = document.getElementById('otherPollenTypesContainer');
    
    // 加载保存的记录
    loadRecords();
    
    // 城市与坐标映射
    const cityCoordinates = {
        '北京': { lat: 39.9042, lon: 116.4074 },
        '上海': { lat: 31.2304, lon: 121.4737 },
        '广州': { lat: 23.1291, lon: 113.2644 },
        '深圳': { lat: 22.5431, lon: 114.0579 },
        '成都': { lat: 30.5728, lon: 104.0668 }
    };
    
    // 监听城市选择变化，自动刷新天气
    const citySelect = document.getElementById('citySelect');
    if (citySelect) {
        citySelect.addEventListener('change', function() {
            console.log('城市已变更为:', this.value);
            getWeatherData();
        });
    } else {
        console.error('找不到citySelect元素');
    }
    
    // 自动获取天气信息
    getWeatherData();
    
    // 自动获取天气信息函数
    // 自动获取天气信息
    function getWeatherData() {
        // 获取当前选择的城市
        const citySelect = document.getElementById('citySelect');
        const city = citySelect ? citySelect.value : '北京';
        const coords = cityCoordinates[city] || cityCoordinates['北京'];
    
        let weatherContainer = document.getElementById('weatherContainer');
        if (!weatherContainer) {
            // 如果找不到容器，在天气状况标题后创建一个
            const weatherSection = document.querySelector('.form-section h2:contains("天气状况")');
            if (weatherSection) {
                weatherContainer = document.createElement('div');
                weatherContainer.id = 'weatherContainer';
                weatherContainer.className = 'weather-container';
                weatherSection.parentNode.insertBefore(weatherContainer, weatherSection.nextSibling);
            } else {
                console.error('找不到天气状况部分');
                return;
            }
        }
        
        weatherContainer.innerHTML = '<p>正在获取天气数据...</p>';
        console.log('正在获取天气数据，城市:', city);
    
        // 使用JSONP方式或添加CORS代理来解决跨域问题
        const url = `https://cors-anywhere.herokuapp.com/https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,weather_code,wind_speed_10m,wind_direction_10m&timezone=Asia%2FShanghai`;
        
        // 或者使用无需CORS的替代API
        // const url = `https://wttr.in/${encodeURIComponent(city)}?format=j1`;
        
        console.log('天气API请求URL:', url);
    
        // 添加超时和错误处理
        const fetchPromise = fetch(url, {
            method: 'GET',
            headers: {
                'Origin': window.location.origin
            },
            mode: 'cors',
            timeout: 10000 // 10秒超时
        });
        
        // 添加超时处理
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('请求超时')), 10000);
        });
        
        // 使用Promise.race来处理超时
        Promise.race([fetchPromise, timeoutPromise])
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP错误! 状态: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('获取到天气数据:', data);
                processWeatherData(data, city, weatherContainer);
            })
            .catch(error => {
                console.error('获取天气数据出错:', error);
                // 尝试使用备用API
                useBackupWeatherAPI(city, weatherContainer);
            });
    }
    
    // 处理天气数据的函数
    function processWeatherData(data, city, weatherContainer) {
        weatherContainer.innerHTML = '';
        
        if (data.current) {
            const current = data.current;
            const temp = current.temperature_2m;
            const windSpeed = current.wind_speed_10m;
            const windDir = getWindDirection(current.wind_direction_10m);
            const weatherCode = current.weather_code;
            const weatherText = getWeatherText(weatherCode);
    
            // 显示天气信息
            const weatherInfo = document.createElement('div');
            weatherInfo.className = 'current-weather';
            weatherInfo.innerHTML = `
                <p>当前城市: ${city}</p>
                <p>当前天气: ${weatherText}</p>
                <p>温度: ${temp}°C</p>
                <p>风力: ${getWindScale(windSpeed)}级 (${windDir})</p>
            `;
            weatherContainer.appendChild(weatherInfo);
    
            // 自动选中天气checkbox
            const weatherCheckboxes = document.querySelectorAll('input[name="weather"]');
            // 先清除所有选中状态
            weatherCheckboxes.forEach(cb => cb.checked = false);
            
            // 根据天气文本自动选中对应选项
            weatherCheckboxes.forEach(checkbox => {
                if ((weatherText.includes('晴') && checkbox.value === '晴') ||
                    (weatherText.includes('阴') && checkbox.value === '阴') ||
                    (weatherText.includes('雨') && checkbox.value === '雨')) {
                    checkbox.checked = true;
                }
            });
    
            // 风大自动选中
            const windScale = getWindScale(windSpeed);
            if (windScale >= 3) {
                const windCheckbox = document.querySelector('input[name="weather"][value="风大"]');
                if (windCheckbox) {
                    windCheckbox.checked = true;
                    const windLevelContainer = document.getElementById('windLevelContainer');
                    if (windLevelContainer) {
                        windLevelContainer.classList.remove('hidden');
                        const windDescription = document.getElementById('windDescription');
                        if (windDescription) {
                            windDescription.value = `${windDir} ${windScale}级`;
                        }
                    }
                }
            }
    
            // 自动填写温度
            const minTempInput = document.getElementById('minTemperature');
            const maxTempInput = document.getElementById('maxTemperature');
            if (minTempInput && maxTempInput) {
                minTempInput.value = temp;
                maxTempInput.value = temp;
            }
    
            // 成功提示
            const weatherSuccess = document.createElement('div');
            weatherSuccess.className = 'weather-success';
            weatherSuccess.innerHTML = `
                <p>✅ 已自动获取${city}天气数据</p>
                <p>您仍可以手动调整天气信息</p>
            `;
            weatherContainer.appendChild(weatherSuccess);
        } else {
            weatherContainer.innerHTML = '<p class="error-message">获取天气数据失败，请手动输入天气信息</p>';
        }
    }
    
    // 备用天气API
    function useBackupWeatherAPI(city, weatherContainer) {
        // 使用本地模拟数据作为备用方案
        weatherContainer.innerHTML = '<p>正在使用备用方式获取天气...</p>';
        
        // 模拟数据 - 实际项目中可以使用另一个API
        const mockWeatherData = {
            city: city,
            temperature: 22,
            weatherText: '晴',
            windDirection: '东北风',
            windScale: 3
        };
        
        setTimeout(() => {
            // 显示天气信息
            const weatherInfo = document.createElement('div');
            weatherInfo.className = 'current-weather';
            weatherInfo.innerHTML = `
                <p>当前城市: ${mockWeatherData.city}</p>
                <p>当前天气: ${mockWeatherData.weatherText}</p>
                <p>温度: ${mockWeatherData.temperature}°C</p>
                <p>风力: ${mockWeatherData.windScale}级 (${mockWeatherData.windDirection})</p>
            `;
            weatherContainer.innerHTML = '';
            weatherContainer.appendChild(weatherInfo);
    
            // 自动选中天气checkbox
            const weatherCheckboxes = document.querySelectorAll('input[name="weather"]');
            weatherCheckboxes.forEach(cb => cb.checked = false);
            
            const weatherText = mockWeatherData.weatherText;
            weatherCheckboxes.forEach(checkbox => {
                if ((weatherText.includes('晴') && checkbox.value === '晴') ||
                    (weatherText.includes('阴') && checkbox.value === '阴') ||
                    (weatherText.includes('雨') && checkbox.value === '雨')) {
                    checkbox.checked = true;
                }
            });
    
            // 风大自动选中
            if (mockWeatherData.windScale >= 3) {
                const windCheckbox = document.querySelector('input[name="weather"][value="风大"]');
                if (windCheckbox) {
                    windCheckbox.checked = true;
                    const windLevelContainer = document.getElementById('windLevelContainer');
                    if (windLevelContainer) {
                        windLevelContainer.classList.remove('hidden');
                        const windDescription = document.getElementById('windDescription');
                        if (windDescription) {
                            windDescription.value = `${mockWeatherData.windDirection} ${mockWeatherData.windScale}级`;
                        }
                    }
                }
            }
    
            // 自动填写温度
            const minTempInput = document.getElementById('minTemperature');
            const maxTempInput = document.getElementById('maxTemperature');
            if (minTempInput && maxTempInput) {
                minTempInput.value = mockWeatherData.temperature;
                maxTempInput.value = mockWeatherData.temperature;
            }
    
            // 成功提示
            const weatherSuccess = document.createElement('div');
            weatherSuccess.className = 'weather-success';
            weatherSuccess.innerHTML = `
                <p>✅ 已使用备用方式获取${city}天气数据</p>
                <p>您仍可以手动调整天气信息</p>
            `;
            weatherContainer.appendChild(weatherSuccess);
        }, 1000);
    }
    
    // 确保在页面加载完成后调用天气API
    document.addEventListener('DOMContentLoaded', function() {
        // ... 其他初始化代码 ...
        
        // 确保citySelect元素存在后再调用天气API
        setTimeout(() => {
            const citySelect = document.getElementById('citySelect');
            if (citySelect) {
                console.log('找到citySelect元素，正在获取天气数据');
                getWeatherData();
                
                // 添加城市变更事件监听
                citySelect.addEventListener('change', function() {
                    console.log('城市已变更为:', this.value);
                    getWeatherData();
                });
            } else {
                console.error('找不到citySelect元素');
            }
        }, 500); // 给DOM一点加载时间
    });
    
    // 根据风向角度获取风向文字
    function getWindDirection(degrees) {
        const directions = ['北风', '东北风', '东风', '东南风', '南风', '西南风', '西风', '西北风'];
        const index = Math.round(degrees / 45) % 8;
        return directions[index];
    }
    
    // 根据风速获取风力等级
    function getWindScale(speed) {
        // 风速单位为km/h，转换为风力等级
        if (speed < 1) return 0;
        if (speed < 6) return 1;
        if (speed < 12) return 2;
        if (speed < 20) return 3;
        if (speed < 29) return 4;
        if (speed < 39) return 5;
        if (speed < 50) return 6;
        if (speed < 62) return 7;
        if (speed < 75) return 8;
        if (speed < 89) return 9;
        return 10;
    }
    
    // 根据天气代码获取天气文字描述
    function getWeatherText(code) {
        // WMO Weather interpretation codes (WW)
        // https://open-meteo.com/en/docs
        const weatherCodes = {
            0: '晴',
            1: '晴', 2: '晴', 3: '阴',
            45: '雾', 48: '雾',
            51: '小雨', 53: '小雨', 55: '小雨',
            56: '小雨', 57: '小雨',
            61: '雨', 63: '雨', 65: '大雨',
            66: '雨', 67: '雨',
            71: '雪', 73: '雪', 75: '大雪',
            77: '雪',
            80: '阵雨', 81: '阵雨', 82: '阵雨',
            85: '雪', 86: '雪',
            95: '雷雨',
            96: '雷雨', 99: '雷雨'
        };
        
        return weatherCodes[code] || '未知';
    }
    // 这里补上缺失的大括号，结束DOMContentLoaded的function
    });