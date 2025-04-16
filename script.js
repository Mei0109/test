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
        // 可继续添加
    };
    
    // 监听城市选择变化，自动刷新天气
    const citySelect = document.getElementById('citySelect');
    if (citySelect) {
        citySelect.addEventListener('change', function() {
            getWeatherData();
        });
    }
    
    // 自动获取天气信息
    function getWeatherData() {
        // 获取当前选择的城市
        const city = citySelect ? citySelect.value : '北京';
        const coords = cityCoordinates[city] || cityCoordinates['北京'];
    
        let weatherContainer = document.getElementById('weatherContainer');
        if (!weatherContainer) {
            // 若不存在则创建（可省略，假设HTML已有）
            return;
        }
        weatherContainer.innerHTML = '';
    
        const weatherLoading = document.createElement('p');
        weatherLoading.textContent = '正在获取天气数据...';
        weatherContainer.appendChild(weatherLoading);
    
        // OpenMeteo API
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,weather_code,wind_speed_10m,wind_direction_10m&timezone=Asia%2FShanghai`;
    
        fetch(url)
            .then(response => response.json())
            .then(data => {
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
                    weatherContainer.innerHTML = '<p>获取天气数据失败，请手动输入天气信息</p>';
                }
            })
            .catch(error => {
                weatherContainer.innerHTML = '<p>获取天气数据失败，请手动输入天气信息</p>';
            });
    }
    
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