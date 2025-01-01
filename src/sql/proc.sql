USE SUSUSHISHI
GO
--Kịch bản 2: Đặt bàn, đặt trước món
GO
CREATE PROCEDURE createTableBooking
    @quantity INT,
    @branchId NVARCHAR(50),
    @customerId NVARCHAR(50),
    @orderType NVARCHAR(50) = 'Online' -- Loại đặt bàn (mặc định là 'Online')
AS
BEGIN
    BEGIN TRY
        -- Bắt đầu giao dịch
        BEGIN TRANSACTION;

        -- Lấy giá trị lớn nhất hiện tại của ORDER_ID
        DECLARE @maxOrderID NVARCHAR(50);
        SELECT @maxOrderID = MAX(ORDER_ID) 
        FROM [ORDER_];

        -- Xử lý giá trị của MaxOrderID
        IF @maxOrderID IS NULL
            SET @maxOrderID = 'O000000'; -- Nếu không có giá trị thì bắt đầu từ O000000
        DECLARE @numericPart INT = CAST(SUBSTRING(@maxOrderID, 2, LEN(@maxOrderID) - 1) AS INT) + 1;
        DECLARE @newOrderID NVARCHAR(50) = 'O' + RIGHT('000000' + CAST(@numericPart AS NVARCHAR), 6);

        -- Lấy ngày và giờ hiện tại
        DECLARE @currentDate DATE = GETDATE();
        DECLARE @currentTime TIME = CONVERT(TIME, GETDATE());

        -- Chèn dữ liệu vào bảng [ORDER_]
        INSERT INTO [ORDER_] (ORDER_ID, ORDER_DATE, BRANCH_ID, CUSTOMER_ID, ORDER_TYPE, ORDER_TIME)
        VALUES (@newOrderID, @currentDate, @branchId, @customerId, @orderType, @currentTime);

        -- Chèn dữ liệu vào bảng ONLINE_ORDER
        INSERT INTO ONLINE_ORDER (OORDER_ID, CUSTOMER_QUANTITY, BRANCH_ID, ARRIVAL_DATE, ARRIVAL_TIME)
        VALUES (@newOrderID, @quantity, @branchId, @currentDate, @currentTime);

        -- Cam kết giao dịch
        COMMIT TRANSACTION;

        -- Trả về thông tin thành công
        SELECT 
            @newOrderID AS newOrderID, 
            'Success' AS Status;
    END TRY
    BEGIN CATCH
        -- Xử lý lỗi và rút lại giao dịch
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        -- Trả về lỗi
        DECLARE @errorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@errorMessage, 16, 1);
    END CATCH
END;
GO

GO
CREATE PROCEDURE getDishesByCategory
    @branchId NVARCHAR(50)
AS
BEGIN
    BEGIN TRY
        -- Truy vấn danh sách món ăn theo danh mục
        SELECT 
            MC.CATEGORY_NAME,
            (
                SELECT 
                    D.DISH_ID,
                    D.DISH_NAME,
                    D.DISH_PRICE
                FROM 
                    DISH D
                JOIN 
                    DISH_AVAILABLE DA ON DA.BRANCH_ID = @branchId 
                        AND DA.DISH_ID = D.DISH_ID 
                        AND DA.IS_AVAILABLE = 1
                WHERE 
                    D.CATEGORY_NAME = MC.CATEGORY_NAME
                FOR JSON PATH
            ) AS DISHES
        FROM 
            (SELECT DISTINCT CATEGORY_NAME FROM DISH) MC
        ORDER BY 
            MC.CATEGORY_NAME;
    END TRY
    BEGIN CATCH
        -- Xử lý lỗi
        DECLARE @errorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@errorMessage, 16, 1);
    END CATCH
END;
GO

--Kết thúc Kịch bản 2: Đặt bàn, đặt trước món
GO
CREATE PROCEDURE getUserIdByAccount 
    @USERNAME NVARCHAR(50)
AS
BEGIN
    SELECT 
		AC.PASSWORD,
        CASE 
            WHEN AC.CUSTOMER_ID IS NULL THEN AC.EMPLOYEE_ID
            ELSE AC.CUSTOMER_ID 
        END AS Id,
        AC.ROLE,
        CASE 
            WHEN AC.CUSTOMER_ID IS NULL THEN E.FULL_NAME
            ELSE C.FULL_NAME
        END AS Name
    FROM ACCOUNT AC
    LEFT JOIN EMPLOYEE E ON AC.EMPLOYEE_ID = E.EMPLOYEE_ID
    LEFT JOIN CUSTOMER C ON AC.CUSTOMER_ID = C.CUSTOMER_ID
    WHERE AC.USERNAME = @USERNAME 
END

GO
CREATE PROC getMenuDropDownItem
AS
BEGIN
    CREATE TABLE #CategoryDish (
        CATEGORY_NAME NVARCHAR(50),
        DISH_NAME NVARCHAR(50)
    );

    -- L?y danh sách các món an theo CATEGORY_NAME
    INSERT INTO #CategoryDish (CATEGORY_NAME, DISH_NAME)
    SELECT 
        d.CATEGORY_NAME, 
        d.DISH_NAME
    FROM 
        (SELECT CATEGORY_NAME, DISH_NAME, ROW_NUMBER() OVER (PARTITION BY CATEGORY_NAME ORDER BY DISH_ID) AS RowNum 
         FROM DISH) d
    WHERE 
        d.RowNum <= 4; -- L?y t?i da 4 món an trong m?i danh m?c

    -- Tr? v? k?t qu? nhóm các món an theo CATEGORY_NAME
    SELECT 
        CATEGORY_NAME,
        STRING_AGG(DISH_NAME, ', ') AS DISHES
    FROM 
        #CategoryDish
    GROUP BY 
        CATEGORY_NAME;

    DROP TABLE #CategoryDish;
END;
GO
select * from EMPLOYEE E
JOIN DEPARTMENT D ON D.DEPARTMENT_ID = E.DEPARTMENT_ID AND D.BRANCH_ID = 'B003'

GO
CREATE PROC getRevenueByDate
    @DATE DATE,
    @BranchId CHAR(4)
AS
BEGIN
    SELECT *
    FROM INVOICE I
    INNER JOIN ORDER_ O ON O.ORDER_ID = I.ORDER_ID
    WHERE O.BRANCH_ID = @BranchId 
      AND CAST(I.ISSUE_DATE AS DATE) = @DATE;
END



GO
CREATE PROC getRevenueByMonth
    @Year INT,
    @Month INT,
    @BranchId CHAR(4)
AS
BEGIN
    SELECT *
    FROM INVOICE I
    JOIN ORDER_ O ON I.ORDER_ID = O.ORDER_ID AND O.BRANCH_ID = @BranchId
    WHERE YEAR(I.ISSUE_DATE) = @Year AND MONTH(I.ISSUE_DATE) = @Month;
END;




GO
CREATE PROC getRevenueByQuarter
    @Year INT,
    @Quarter INT,
    @BranchId CHAR(4)
AS
BEGIN
    DECLARE @StartDate DATE;
    DECLARE @EndDate DATE;

    IF @Quarter = 1
    BEGIN
        SET @StartDate = CAST(@Year AS VARCHAR) + '-01-01'; 
        SET @EndDate = CAST(@Year AS VARCHAR) + '-03-31'; 
    END
    ELSE IF @Quarter = 2
    BEGIN
        SET @StartDate = CAST(@Year AS VARCHAR) + '-04-01'; 
        SET @EndDate = CAST(@Year AS VARCHAR) + '-06-30'; 
    END
    ELSE IF @Quarter = 3
    BEGIN
        SET @StartDate = CAST(@Year AS VARCHAR) + '-07-01'; 
        SET @EndDate = CAST(@Year AS VARCHAR) + '-09-30'; 
    END
    ELSE IF @Quarter = 4
    BEGIN
        SET @StartDate = CAST(@Year AS VARCHAR) + '-10-01'; 
        SET @EndDate = CAST(@Year AS VARCHAR) + '-12-31'; 
    END

    SELECT *
    FROM INVOICE I
    JOIN ORDER_ O ON I.ORDER_ID = O.ORDER_ID
    WHERE O.BRANCH_ID = @BranchId
    AND I.ISSUE_DATE BETWEEN @StartDate AND @EndDate
END



GO
CREATE PROC getRevenueByYear
	@Year INT,
    @BranchId CHAR(4)
AS
BEGIN
	SELECT *
	FROM INVOICE I
	JOIN ORDER_ O ON I.ORDER_ID = O.ORDER_ID
    WHERE O.BRANCH_ID = @BranchId
	AND YEAR(I.ISSUE_DATE) = @Year
END


SELECT * FROM DEPARTMENT
select * from dish

--UPDATE INVOICE
--SET DISCOUNT_AMOUNT = (
--    SELECT MS.DISCOUNT_AMOUNT
--    FROM MEMBERSHIP_CARD MS
--    JOIN CUSTOMER C ON C.CUSTOMER_ID = MS.CUSTOMER_ID
--    JOIN ORDER_ O ON O.CUSTOMER_ID = C.CUSTOMER_ID
--    WHERE INVOICE.ORDER_ID = O.ORDER_ID

--);

--SELECT * FROM MEMBERSHIP_CARD
--UPDATE Invoice
--SET FINAL_AMOUNT = (
--    SELECT 
--        CASE 
--            WHEN SUM(od.QUANTITY * d.DISH_PRICE) - DISCOUNT_AMOUNT < 0 THEN 0
--            ELSE SUM(od.QUANTITY * d.DISH_PRICE) - DISCOUNT_AMOUNT
--        END
--    FROM ORDER_DISH od
--    JOIN DISH d ON od.DISH_ID = d.DISH_ID
--    WHERE od.ORDER_ID = Invoice.ORDER_ID
--);

GO
CREATE PROC getRatingByDate
	@DATE DATE,
	@BranchId CHAR(4),
	@EmployeeId CHAR(7)
AS
BEGIN
	SELECT E.EMPLOYEE_ID, E.FULL_NAME, AVG(CAST(OFO.EMPLYEE_RATING AS FLOAT)) AS AVERAGE_RATE 
	FROM EMPLOYEE E
	JOIN OFFLINE_ORDER OFO ON OFO.EMPLOYEE_ID = E.EMPLOYEE_ID
	JOIN ORDER_ O ON O.ORDER_ID = OFO.OFORDER_ID AND O.ORDER_DATE = @DATE
	JOIN DEPARTMENT D ON D.DEPARTMENT_ID = E.DEPARTMENT_ID AND D.BRANCH_ID = @BranchId
	WHERE E.EMPLOYEE_ID = @EmployeeId
	GROUP BY E.EMPLOYEE_ID, E.FULL_NAME
END
SELECT * FROM EMPLOYEE


EXEC getRatingByDate @DATE = '12-22-2018', @BranchId = 'B001', @EmployeeId = 'E014327'

GO
CREATE PROC getRatingByMonth
	@MONTH int,
	@YEAR int,
	@BranchId CHAR(4),
	@EmployeeId CHAR(7)
AS
BEGIN
	SELECT E.EMPLOYEE_ID, E.FULL_NAME, AVG(CAST(OFO.EMPLYEE_RATING AS FLOAT)) AS AVERAGE_RATE 
	FROM EMPLOYEE E
	JOIN OFFLINE_ORDER OFO ON OFO.EMPLOYEE_ID = E.EMPLOYEE_ID
	JOIN ORDER_ O ON O.ORDER_ID = OFO.OFORDER_ID AND YEAR(O.ORDER_DATE) = @YEAR AND MONTH(O.ORDER_DATE) = @MONTH
	JOIN DEPARTMENT D ON D.DEPARTMENT_ID = E.DEPARTMENT_ID AND D.BRANCH_ID = @BranchId
	WHERE E.EMPLOYEE_ID = @EmployeeId
	GROUP BY E.EMPLOYEE_ID, E.FULL_NAME
END

EXEC getRatingByMonth @MONTH = 12, @YEAR = 2018, @BranchId = 'B001', @EmployeeId = 'E014327'

GO
CREATE PROC getRatingByQuarter
	@Quarter INT,          -- Quý c?n tính toán (1, 2, 3, ho?c 4)
	@Year INT,             -- Nam c?n tính toán
	@BranchId CHAR(4),     -- Mã chi nhánh
	@EmployeeId CHAR(7)    -- Mã nhân viên
AS
BEGIN
	-- Biến lưu phạm vi ngày
	DECLARE @StartDate DATE;
	DECLARE @EndDate DATE;

	-- Tính toán phạm vi ngày của quý
	IF @Quarter = 1
	BEGIN
		SET @StartDate = CAST(@Year AS VARCHAR) + '-01-01'; -- Ngày bắt đầu quý 1
		SET @EndDate = CAST(@Year AS VARCHAR) + '-03-31';   -- Ngày kết thúc quý 1
	END
	ELSE IF @Quarter = 2
	BEGIN
		SET @StartDate = CAST(@Year AS VARCHAR) + '-04-01'; -- Ngày bắt đầu quý 2
		SET @EndDate = CAST(@Year AS VARCHAR) + '-06-30';   -- Ngày kết thúc quý 2
	END
	ELSE IF @Quarter = 3
	BEGIN
		SET @StartDate = CAST(@Year AS VARCHAR) + '-07-01'; -- Ngày bắt đầu quý 3
		SET @EndDate = CAST(@Year AS VARCHAR) + '-09-30';   -- Ngày k?t thúc quý 3
	END
	ELSE IF @Quarter = 4
	BEGIN
		SET @StartDate = CAST(@Year AS VARCHAR) + '-10-01'; -- Ngày bắt đầu quý 4
		SET @EndDate = CAST(@Year AS VARCHAR) + '-12-31';   -- Ngày kết thúc quý 4
	END

	-- Lấy dữ liệu điểm trung bình trong phạm vi quý
	SELECT 
    E.EMPLOYEE_ID, 
    E.FULL_NAME, 
    ISNULL(AVG(CAST(OFO.EMPLYEE_RATING AS FLOAT)), 0) AS AVERAGE_RATE 
	FROM EMPLOYEE E
	LEFT JOIN OFFLINE_ORDER OFO ON OFO.EMPLOYEE_ID = E.EMPLOYEE_ID
	LEFT JOIN ORDER_ O ON O.ORDER_ID = OFO.OFORDER_ID
	JOIN DEPARTMENT D ON D.DEPARTMENT_ID = E.DEPARTMENT_ID AND D.BRANCH_ID = @BranchId
	WHERE 
		E.EMPLOYEE_ID = @EmployeeId
		AND (O.ORDER_DATE BETWEEN @StartDate AND @EndDate OR O.ORDER_DATE IS NULL)
	GROUP BY 
		E.EMPLOYEE_ID, 
		E.FULL_NAME;
END


GO
CREATE PROC getRatingByYear
    @YEAR INT,
    @BranchId CHAR(4),
    @EmployeeId CHAR(7)
AS
BEGIN
    SELECT 
        E.EMPLOYEE_ID, 
        E.FULL_NAME, 
        ISNULL(AVG(CAST(OFO.EMPLYEE_RATING AS FLOAT)), 0) AS AVERAGE_RATE 
    FROM EMPLOYEE E
    LEFT JOIN OFFLINE_ORDER OFO 
        ON OFO.EMPLOYEE_ID = E.EMPLOYEE_ID
    LEFT JOIN ORDER_ O 
        ON O.ORDER_ID = OFO.OFORDER_ID 
        AND YEAR(O.ORDER_DATE) = @YEAR
    JOIN DEPARTMENT D 
        ON D.DEPARTMENT_ID = E.DEPARTMENT_ID 
        AND D.BRANCH_ID = @BranchId
    WHERE E.EMPLOYEE_ID = @EmployeeId
    GROUP BY 
        E.EMPLOYEE_ID, 
        E.FULL_NAME;
END;

SELECT * FROM OFFLINE_ORDER OFO
JOIN EMPLOYEE E ON E.EMPLOYEE_ID = OFO.EMPLOYEE_ID
JOIN DEPARTMENT D ON D.DEPARTMENT_ID = E.DEPARTMENT_ID AND D.BRANCH_ID = 'B002'

select * from ONLINE_ORDER WHERE OORDER_ID = 'O023963'
GO

CREATE PROC payOrder
    @OrderId CHAR(7),
	@BranchId CHAR(7),
    @StaffRating INT,
    @OrderType NVARCHAR(50)
AS
BEGIN
    DECLARE @DiscountAmount DECIMAL(18, 2);
    DECLARE @FinalAmount DECIMAL(18, 2);
    DECLARE @TotalAmountForPoints DECIMAL(18, 2);
    DECLARE @Points INT;
    DECLARE @NewInvoiceId CHAR(7);
    DECLARE @CurrentMaxInvoiceId INT;
    DECLARE @TableNum TINYINT;

    -- Lấy giá trị lớn nhất của INVOICE_ID
    SELECT 
        @CurrentMaxInvoiceId = MAX(CAST(SUBSTRING(INVOICE_ID, 2, LEN(INVOICE_ID) - 1) AS INT))
    FROM 
        INVOICE;

    -- Tạo INVOICE_ID mới
    SET @NewInvoiceId = 'I' + RIGHT('000000' + CAST(@CurrentMaxInvoiceId + 1 AS VARCHAR), 6);

    -- Lấy số tiền giảm giá
    SELECT 
        @DiscountAmount = ISNULL(MC.DISCOUNT_AMOUNT, 0)
    FROM 
        [ORDER_]
    JOIN 
        CUSTOMER ON CUSTOMER.CUSTOMER_ID = [ORDER_].CUSTOMER_ID
    LEFT JOIN 
        MEMBERSHIP_CARD MC ON MC.CUSTOMER_ID = CUSTOMER.CUSTOMER_ID
    WHERE 
        [ORDER_].ORDER_ID = @OrderId;

    -- Tính toán tổng tiền cuối cùng
    SELECT 
        @FinalAmount = SUM(OD.QUANTITY * D.DISH_PRICE) - @DiscountAmount
    FROM 
        ORDER_DISH OD
    JOIN 
        DISH D ON D.DISH_ID = OD.DISH_ID
    WHERE 
        OD.ORDER_ID = @OrderId;

    IF @FinalAmount < 0 
        SET @FinalAmount = 0;

    -- Tính số tiền để cộng điểm
    SET @TotalAmountForPoints = @FinalAmount + @DiscountAmount;

    -- Tính số điểm (1 point = 100,000 VNĐ)
    SET @Points = FLOOR(@TotalAmountForPoints / 100000);

    -- Thêm hóa đơn mới vào bảng INVOICE
    INSERT INTO INVOICE (
        INVOICE_ID, 
        FINAL_AMOUNT, 
        DISCOUNT_AMOUNT, 
        ISSUE_DATE, 
        ISSUE_TIME, 
        ORDER_ID
    )
    VALUES (
        @NewInvoiceId, -- INVOICE_ID mới
        @FinalAmount,
        @DiscountAmount,
        GETDATE(), -- Ngày hiện tại
        CONVERT(TIME, GETDATE()), -- Thời gian hiện tại
        @OrderId
    );

    -- Nếu OrderType là Offline, cập nhật StaffRating vào bảng OFFLINE_ORDER
    IF @OrderType = 'Offline'
    BEGIN
        UPDATE OFFLINE_ORDER
        SET EMPLYEE_RATING = @StaffRating
        WHERE OFORDER_ID = @OrderId;
        -- Lấy Table ID để đặt lại trạng thái bàn
        SELECT @TableNum = TABLE_NUMBER
        FROM OFFLINE_ORDER
        WHERE OFORDER_ID = @OrderId;

        -- Cập nhật trạng thái bàn
        IF @TableNum IS NOT NULL
        BEGIN
            UPDATE [TABLE_]
            SET TABLE_STATUS = N'Còn trống'
            WHERE TABLE_NUM = @TableNum AND BRANCH_ID = @BranchId;
        END
    END
	IF @OrderType = 'Online'
	BEGIN
        -- Lấy Table ID để đặt lại trạng thái bàn
        SELECT @TableNum = TABLE_NUMBER
        FROM ONLINE_ORDER
        WHERE OORDER_ID = @OrderId;

        -- Cập nhật trạng thái bàn
        IF @TableNum IS NOT NULL
        BEGIN
            UPDATE [TABLE_]
            SET TABLE_STATUS = N'Còn trống'
            WHERE TABLE_NUM = @TableNum AND BRANCH_ID = @BranchId;
        END
    END

    -- Cập nhật điểm vào Membership_Card nếu khách hàng có thẻ
    IF EXISTS (
        SELECT 1 
        FROM [ORDER_] O
        JOIN CUSTOMER C ON O.CUSTOMER_ID = C.CUSTOMER_ID
        JOIN MEMBERSHIP_CARD MC ON C.CUSTOMER_ID = MC.CUSTOMER_ID
        WHERE O.ORDER_ID = @OrderId
    )
    BEGIN
        UPDATE MEMBERSHIP_CARD
        SET POINTS = POINTS + @Points
        FROM [ORDER_] O
        JOIN CUSTOMER C ON O.CUSTOMER_ID = C.CUSTOMER_ID
        WHERE O.ORDER_ID = @OrderId
          AND MEMBERSHIP_CARD.CUSTOMER_ID = C.CUSTOMER_ID;
    END
END
GO


GO
CREATE PROC deleteOrder
    @ORDER_ID CHAR(7),
    @ORDER_TYPE NVARCHAR(50),
    @BRANCH_ID CHAR(4)
AS
BEGIN
    BEGIN TRANSACTION;
    BEGIN TRY
        -- Xoá các b?n ghi trong ORDER_DISH
        DELETE FROM ORDER_DISH 
        WHERE ORDER_ID = @ORDER_ID;

        -- Ki?m tra lo?i don hàng và th?c hi?n xoá
        IF @ORDER_TYPE = 'Delivery'
        BEGIN
            DELETE FROM DELIVERY_ORDER
            WHERE DORDER_ID = @ORDER_ID;
        END
        ELSE IF @ORDER_TYPE = 'Offline'
        BEGIN
            -- Xoá t? b?ng OFFLINE_ORDER
            DELETE FROM OFFLINE_ORDER
            WHERE OFORDER_ID = @ORDER_ID;

            -- C?p nh?t tr?ng thái bàn TABLE_
            UPDATE TABLE_
            SET TABLE_STATUS = N'Còn tr?ng'
            FROM TABLE_ T
            JOIN OFFLINE_ORDER O ON T.TABLE_NUM = O.TABLE_NUMBER
            WHERE O.OFORDER_ID = @ORDER_ID AND T.BRANCH_ID = @BRANCH_ID;
        END
        ELSE IF @ORDER_TYPE = 'Online'
        BEGIN
            -- Xoá t? b?ng ONLINE_ORDER
            DELETE FROM ONLINE_ORDER
            WHERE OORDER_ID = @ORDER_ID;
        END

        -- Xoá ORDER
        DELETE FROM ORDER_
        WHERE ORDER_ID = @ORDER_ID;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        -- Rollback khi có l?i
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

CREATE PROCEDURE getInvoiceByPhone
    @CUSTOMER_PHONE VARCHAR(15) = NULL,
    @DATE DATE = NULL
AS
BEGIN
    -- Nếu có CUSTOMER_PHONE và DATE d?u NULL, tr? v? r?ng
    IF @CUSTOMER_PHONE IS NULL AND @DATE IS NULL
    BEGIN
        -- Tr? v? b?ng tr?ng cho k?t qu? hóa don
        SELECT TOP 0 
            I.INVOICE_ID, 
            I.FINAL_AMOUNT, 
            I.DISCOUNT_AMOUNT, 
            I.ISSUE_DATE, 
            I.ISSUE_TIME
        FROM INVOICE I;

        -- Tr? v? b?ng tr?ng cho danh sách món an
        SELECT TOP 0 
            I.INVOICE_ID,
            OD.DISH_ID,
            OD.QUANTITY AS AMOUNT,
            D.DISH_NAME,
            D.DISH_PRICE
        FROM INVOICE I
        LEFT JOIN ORDER_DISH OD ON I.ORDER_ID = OD.ORDER_ID
        LEFT JOIN DISH D ON D.DISH_ID = OD.DISH_ID;

        RETURN;
    END;

    -- Bi?n d? luu Invoice ID duy nh?t
    DECLARE @InvoiceId CHAR(7);

    -- Tìm khách hàng dựa trên số điện thoại
    DECLARE @CustomerId CHAR(7) = (
        SELECT CUSTOMER_ID 
        FROM CUSTOMER
        WHERE PHONE_NUMBER = @CUSTOMER_PHONE
    );

    -- Lấy hóa don phù hợp nhất dựa trên CUSTOMER_ID và DATE
    SELECT I.INVOICE_ID, I.FINAL_AMOUNT, I.DISCOUNT_AMOUNT, I.ISSUE_DATE, I.ISSUE_TIME
    FROM INVOICE I
    LEFT JOIN [ORDER_] O ON O.ORDER_ID = I.ORDER_ID
    WHERE 
        (@CustomerId IS NULL OR O.CUSTOMER_ID = @CustomerId)
        AND (@DATE IS NULL OR CAST(I.ISSUE_DATE AS DATE) = @DATE)
    ORDER BY I.ISSUE_DATE DESC, I.ISSUE_TIME DESC;

    -- Danh sách món an của các hóa don
    SELECT 
        I.INVOICE_ID,
        OD.DISH_ID,
        OD.QUANTITY AS AMOUNT,
        D.DISH_NAME,
        D.DISH_PRICE
    FROM INVOICE I
    LEFT JOIN ORDER_DISH OD ON I.ORDER_ID = OD.ORDER_ID
    LEFT JOIN DISH D ON D.DISH_ID = OD.DISH_ID
    WHERE 
        (@CustomerId IS NULL OR I.ORDER_ID IN (
            SELECT ORDER_ID FROM [ORDER_] WHERE CUSTOMER_ID = @CustomerId
        ))
        AND (@DATE IS NULL OR CAST(I.ISSUE_DATE AS DATE) = @DATE)
    ORDER BY I.INVOICE_ID, D.DISH_NAME;
END;
GO

CREATE PROCEDURE createCustomerCardForNew
    @fullName NVARCHAR(50),
    @phoneNumber CHAR(15),
    @email CHAR(50),
    @identityCard CHAR(15),
    @gender NVARCHAR(5),
    @employeeId CHAR(7)
AS
BEGIN
    SET NOCOUNT ON;

    -- Kiểm tra nếu khách hàng đã tồn tại theo số điện thoại
    IF EXISTS (
        SELECT 1 
        FROM CUSTOMER 
        WHERE PHONE_NUMBER = @phoneNumber
    )
    BEGIN
        -- Kiểm tra nếu khách hàng đã có thẻ thành viên
        IF EXISTS (
            SELECT 1 
            FROM CUSTOMER C
            JOIN MEMBERSHIP_CARD MC ON C.CUSTOMER_ID = MC.CUSTOMER_ID
            WHERE C.PHONE_NUMBER = @phoneNumber
        )
        BEGIN
            -- Nếu khách hàng đã có thẻ, thoát khỏi thủ tục
            PRINT 'Khách hàng đã có thẻ thành viên.';
            RETURN;
        END
        ELSE
        BEGIN
            -- Nếu khách hàng chưa có thẻ, tạo thẻ cho khách hàng hiện tại
            DECLARE @existingCustomerId CHAR(7);
            SELECT @existingCustomerId = CUSTOMER_ID 
            FROM CUSTOMER 
            WHERE PHONE_NUMBER = @phoneNumber;

            -- Tạo CARD_ID mới
            DECLARE @newCardId CHAR(7);
            SELECT @newCardId = 'C' + RIGHT('00000' + CAST(ISNULL(MAX(CAST(SUBSTRING(CARD_ID, 2, 6) AS INT)), 0) + 1 AS NVARCHAR), 6)
            FROM MEMBERSHIP_CARD;

            INSERT INTO MEMBERSHIP_CARD (CARD_ID, CARD_TYPE, CUSTOMER_ID, DATE_ISSUED, EMPLOYEE_ID, POINTS, CARD_STATUS, DISCOUNT_AMOUNT)
            VALUES (
                @newCardId, 
                N'Thẻ thành viên', 
                @existingCustomerId, 
                GETDATE(), 
                @employeeId, 
                0, 
                'active', 
                0
            );

            PRINT 'Thẻ thành viên đã được tạo thành công cho khách hàng hiện tại.';
            RETURN;
        END
    END

    -- Nếu khách hàng chưa tồn tại, tạo mới khách hàng
    DECLARE @newCustomerId CHAR(7);
    SELECT @newCustomerId = RIGHT('000000' + CAST(ISNULL(MAX(CAST(LEFT(CUSTOMER_ID, 6) AS INT)), 0) + 1 AS NVARCHAR), 6) + 'C'
    FROM CUSTOMER;

    INSERT INTO CUSTOMER (CUSTOMER_ID, FULL_NAME, PHONE_NUMBER, EMAIL, IDENTITY_CARD, GENDER)
    VALUES (
        @newCustomerId, 
        @fullName, 
        @phoneNumber, 
        @email, 
        @identityCard, 
        @gender
    );

    -- Tạo CARD_ID mới
    DECLARE @newCardId1 CHAR(7);
    SELECT @newCardId1 = 'C' + RIGHT('00000' + CAST(ISNULL(MAX(CAST(SUBSTRING(CARD_ID, 2, 6) AS INT)), 0) + 1 AS NVARCHAR), 6)
    FROM MEMBERSHIP_CARD;

    INSERT INTO MEMBERSHIP_CARD (CARD_ID, CARD_TYPE, CUSTOMER_ID, DATE_ISSUED, EMPLOYEE_ID, POINTS, CARD_STATUS, DISCOUNT_AMOUNT)
    VALUES (
        @newCardId1, 
        N'Thẻ thành viên', 
        @newCustomerId, 
        GETDATE(), 
        @employeeId, 
        0, 
        'Active', 
        0
    );

END;
GO
CREATE PROCEDURE createCustomerCardForOld
    @phoneNumber CHAR(15),
    @identityCard CHAR(15),
    @employeeId CHAR(7)
AS
BEGIN
    -- 1. Cập nhật số căn cước công dân cho khách hàng có PHONE_NUMBER = @phoneNumber
    UPDATE CUSTOMER
    SET IDENTITY_CARD = @identityCard
    WHERE PHONE_NUMBER = @phoneNumber;

    -- 2. Lấy CUSTOMER_ID của khách hàng dựa trên PHONE_NUMBER
    DECLARE @customerId CHAR(7);
    SELECT @customerId = CUSTOMER_ID
    FROM CUSTOMER
    WHERE PHONE_NUMBER = @phoneNumber;

    -- 3. Kiểm tra nếu khách hàng đã có thẻ "Active"
    IF NOT EXISTS (
        SELECT 1
        FROM MEMBERSHIP_CARD MC
        WHERE MC.CUSTOMER_ID = @customerId
        AND MC.CARD_STATUS = 'Active'
    )
    BEGIN
        -- 4. Nếu không có thẻ "Active", tạo thẻ mới cho khách hàng

        -- Tạo mới CARD_ID (tăng dần)
        DECLARE @newCardId CHAR(7);
        SELECT @newCardId = 'C' + RIGHT('000000' + CAST(MAX(CAST(SUBSTRING(CARD_ID, 2, 6) AS INT)) + 1 AS VARCHAR(6)), 6)
        FROM MEMBERSHIP_CARD;

        -- Thêm thẻ mới vào bảng MEMBERSHIP_CARD
        INSERT INTO MEMBERSHIP_CARD (
            CARD_ID, CARD_TYPE, CUSTOMER_ID, DATE_ISSUED, EMPLOYEE_ID, POINTS, CARD_STATUS, DISCOUNT_AMOUNT
        )
        VALUES (
            @newCardId,  -- CARD_ID là giá trị mới
            N'Thẻ thành viên',  -- CARD_TYPE là 'Thẻ thành viên'
            @customerId,  -- CUSTOMER_ID là giá trị lấy từ khách hàng
            GETDATE(),  -- Ngày cấp thẻ
            @employeeId,  -- EMPLOYEE_ID là ID nhân viên tạo thẻ
            0,  -- POINTS là 0
            'Active',  -- CARD_STATUS là 'Active'
            0  -- DISCOUNT_AMOUNT là 0
        );
    END
END

GO
CREATE PROCEDURE getMembershipCardInfo
    @CustomerID CHAR(7) -- Thay đổi kiểu dữ liệu cho phù hợp
AS
BEGIN
    SELECT *
    FROM MEMBERSHIP_CARD MC
    WHERE MC.CUSTOMER_ID = @CustomerID; -- So sánh trực tiếp, không chuyển đổi kiểu
END

GO
CREATE PROCEDURE getOrdersByBranch
    @branchId NVARCHAR(50)
AS
BEGIN
    SELECT 
        O.ORDER_ID, 
        O.ORDER_DATE, 
        O.ORDER_TYPE, 
        O.ORDER_TIME,
        CASE 
            WHEN I.ORDER_ID IS NOT NULL THEN N'Đã thanh toán'
            ELSE N'Chưa thanh toán'
        END AS STATUS
    FROM 
        [ORDER_] O
    LEFT JOIN 
        [INVOICE] I ON O.ORDER_ID = I.ORDER_ID
    WHERE 
        O.BRANCH_ID = @branchId
    ORDER BY 
        CASE 
            WHEN I.ORDER_ID IS NULL THEN 0 -- Chưa thanh toán lên đầu
            ELSE 1 -- Đã thanh toán sau
        END,
        O.ORDER_DATE DESC,
		O.ORDER_TIME DESC;
END;

select * from ORDER_


GO 
CREATE PROCEDURE getMenuByBranch
    @branchId NVARCHAR(50)
AS
BEGIN
    SELECT 
        MC.CATEGORY_NAME,
        (
            SELECT 
                D.DISH_ID,
                D.DISH_NAME,
                D.DISH_PRICE
            FROM 
                DISH D
            JOIN 
                DISH_AVAILABLE DA ON DA.BRANCH_ID = @branchId 
                AND DA.DISH_ID = D.DISH_ID 
                AND DA.IS_AVAILABLE = 1
            WHERE 
                D.CATEGORY_NAME = MC.CATEGORY_NAME
            FOR JSON PATH
        ) AS DISHES
    FROM 
        (SELECT DISTINCT CATEGORY_NAME FROM DISH) MC
    ORDER BY 
        MC.CATEGORY_NAME;
END;

GO
CREATE PROCEDURE UpdateEmployeeAndWorkHistory
  @EmployeeId CHAR(7),
  @FullName NVARCHAR(255),
  @Gender NVARCHAR(50),
  @DepartmentId CHAR(7),
  @Dob DATE = NULL,
  @TerminationDate DATE = NULL,
  @StartDateWork DATE
AS
BEGIN
  BEGIN TRY
    BEGIN TRANSACTION;

    -- Cập nhật thông tin nhân viên
    UPDATE EMPLOYEE
    SET 
      FULL_NAME = @FullName,
      GENDER = @Gender,
      DEPARTMENT_ID = @DepartmentId,
      DATE_OF_BIRTH = @Dob,
      TERMINATION_DATE = @TerminationDate,
      START_DATE_WORK = @StartDateWork
    WHERE EMPLOYEE_ID = @EmployeeId;

    -- Kiểm tra nếu bản ghi WORK_HISTORY với StartDateWork đã tồn tại
    IF NOT EXISTS (
      SELECT 1 
      FROM WORK_HISTORY 
      WHERE EMPLOYEE_ID = @EmployeeId AND BRANCH_START_DATE = @StartDateWork
    )
    BEGIN
      -- Thêm bản ghi mới nếu không tồn tại
      INSERT INTO WORK_HISTORY (BRANCH_START_DATE, BRANCH_END_DATE, EMPLOYEE_ID, BRANCH_ID)
      VALUES (@StartDateWork, NULL, @EmployeeId, @DepartmentId);
    END;

    -- Nếu có TerminationDate
    IF @TerminationDate IS NOT NULL
    BEGIN
      -- Cập nhật BRANCH_END_DATE cho bản ghi tương ứng
      UPDATE WORK_HISTORY
      SET BRANCH_END_DATE = @TerminationDate
      WHERE EMPLOYEE_ID = @EmployeeId AND BRANCH_START_DATE = @StartDateWork;
    END
    ELSE
    BEGIN
      -- Nếu không có TerminationDate, đảm bảo BRANCH_END_DATE vẫn là NULL
      UPDATE WORK_HISTORY
      SET BRANCH_END_DATE = NULL
      WHERE EMPLOYEE_ID = @EmployeeId AND BRANCH_START_DATE = @StartDateWork;
    END;

    COMMIT TRANSACTION;
  END TRY
  BEGIN CATCH
    ROLLBACK TRANSACTION;
    THROW;
  END CATCH
END;

GO
CREATE PROCEDURE getOrderDishForUpdate
    @branchId CHAR(4),
    @orderId CHAR(7)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        MC.CATEGORY_NAME,
        (
            SELECT 
                D.DISH_ID,
                D.DISH_NAME,
                D.DISH_PRICE,
                ISNULL(OD.QUANTITY, 0) AS QUANTITY
            FROM 
                DISH D
            LEFT JOIN 
                DISH_AVAILABLE DA 
                ON DA.BRANCH_ID = @branchId 
                AND DA.DISH_ID = D.DISH_ID 
                AND DA.IS_AVAILABLE = 1
            LEFT JOIN 
                ORDER_DISH OD 
                ON OD.DISH_ID = D.DISH_ID 
                AND OD.ORDER_ID = @orderId
            WHERE 
                D.CATEGORY_NAME = MC.CATEGORY_NAME
            FOR JSON PATH
        ) AS DISHES
    FROM 
        (SELECT DISTINCT CATEGORY_NAME FROM DISH) MC
    ORDER BY 
        MC.CATEGORY_NAME;
END;

GO
CREATE PROCEDURE UpdateOrderDish
    @orderId CHAR(7),
    @dishId CHAR(4),
    @quantity INT
AS
BEGIN
    IF @quantity = 0
    BEGIN
        DELETE FROM order_dish 
        WHERE ORDER_ID = @orderId AND DISH_ID = @dishId;
    END
    ELSE
    BEGIN
        IF EXISTS (
            SELECT 1 
            FROM order_dish 
            WHERE ORDER_ID = @orderId AND DISH_ID = @dishId
        )
        BEGIN
            UPDATE order_dish
            SET QUANTITY = @quantity
            WHERE ORDER_ID = @orderId AND DISH_ID = @dishId;
        END
        ELSE
        BEGIN
            INSERT INTO order_dish (ORDER_ID, DISH_ID, QUANTITY)
            VALUES (@orderId, @dishId, @quantity);
        END
    END
END;

GO
CREATE PROCEDURE UpdateTableAndOrder
    @orderId CHAR(7),
    @tableNum INT,
    @branchId CHAR(4),
    @orderType NVARCHAR(10)
AS
BEGIN
    IF @orderType = 'Online'
    BEGIN
        UPDATE ONLINE_ORDER 
        SET TABLE_NUMBER = @tableNum 
        WHERE OORDER_ID = @orderId;

        UPDATE TABLE_
        SET TABLE_STATUS = 'Đang phục vụ'
        WHERE TABLE_NUM = @tableNum;
    END
    ELSE IF @orderType = 'Offline'
    BEGIN
        UPDATE OFFLINE_ORDER 
        SET TABLE_NUMBER = @tableNum
        WHERE OFORDER_ID = @orderId;

        UPDATE TABLE_
        SET TABLE_STATUS = 'Đang phục vụ'
        WHERE TABLE_NUM = @tableNum AND BRANCH_ID = @branchId;
    END
END;





GO
CREATE PROCEDURE updateMembershipCardByYear
AS
BEGIN
    -- Tạo bảng tạm để lưu trạng thái ban đầu của thẻ
    CREATE TABLE #TempMembershipCard (
        CARD_ID CHAR(7) PRIMARY KEY,
        CARD_TYPE NVARCHAR(50),
        POINTS INT,
        DISCOUNT_AMOUNT INT
    );

    -- Sao chép dữ liệu ban đầu vào bảng tạm
    INSERT INTO #TempMembershipCard (CARD_ID, CARD_TYPE, POINTS, DISCOUNT_AMOUNT)
    SELECT CARD_ID, CARD_TYPE, POINTS, DISCOUNT_AMOUNT
    FROM MEMBERSHIP_CARD;

    -- Cập nhật từ 'Thẻ Gold' xuống 'Thẻ Silver' nếu POINTS < 100
    UPDATE MEMBERSHIP_CARD
    SET CARD_TYPE = N'Thẻ Silver',
        POINTS = 0,
        DISCOUNT_AMOUNT = 100000
    FROM MEMBERSHIP_CARD MC
    INNER JOIN #TempMembershipCard TMC ON MC.CARD_ID = TMC.CARD_ID
    WHERE TMC.CARD_TYPE = N'Thẻ Gold'
      AND TMC.POINTS < 100;

    -- Cập nhật từ 'Thẻ Silver' xuống 'Thẻ Thành Viên' nếu POINTS < 50
    -- Chỉ xét các thẻ Silver ban đầu, không xét các thẻ mới bị chuyển từ Gold
    UPDATE MEMBERSHIP_CARD
    SET CARD_TYPE = N'Thẻ Thành Viên',
        DISCOUNT_AMOUNT = 50000,
        POINTS = 0
    FROM MEMBERSHIP_CARD MC
    INNER JOIN #TempMembershipCard TMC ON MC.CARD_ID = TMC.CARD_ID
    WHERE TMC.CARD_TYPE = N'Thẻ Silver'
      AND TMC.POINTS < 50;

    -- Cập nhật từ 'Thẻ Silver' lên 'Thẻ Gold' nếu POINTS >= 100
    -- Chỉ xét các thẻ Silver ban đầu
    UPDATE MEMBERSHIP_CARD
    SET CARD_TYPE = N'Thẻ Gold',
        DISCOUNT_AMOUNT = 200000, 
        POINTS = 0
    FROM MEMBERSHIP_CARD MC
    INNER JOIN #TempMembershipCard TMC ON MC.CARD_ID = TMC.CARD_ID
    WHERE TMC.CARD_TYPE = N'Thẻ Silver'
      AND TMC.POINTS >= 100;

    -- Cập nhật từ 'Thẻ Thành Viên' lên 'Thẻ Silver' nếu POINTS >= 100
    UPDATE MEMBERSHIP_CARD
    SET CARD_TYPE = N'Thẻ Silver',
        POINTS = 0,
        DISCOUNT_AMOUNT = 100000
    FROM MEMBERSHIP_CARD MC
    INNER JOIN #TempMembershipCard TMC ON MC.CARD_ID = TMC.CARD_ID
    WHERE TMC.CARD_TYPE = N'Thẻ Thành Viên'
      AND TMC.POINTS >= 100;

    -- Cập nhật POINTS = 0 cho tất cả thẻ, trừ 'Thẻ Thành Viên'
    UPDATE MEMBERSHIP_CARD
    SET POINTS = 0
    WHERE CARD_TYPE <> N'Thẻ Thành Viên';

    -- Xóa bảng tạm sau khi xử lý
    DROP TABLE #TempMembershipCard;
END;

EXEC updateMembershipCardByYear





SELECT * FROM RESTAURANT_BRANCH
SELECT * FROM TABLE_
SELECT * FROM CUSTOMER JOIN MEMBERSHIP_CARD ON MEMBERSHIP_CARD.CUSTOMER_ID = CUSTOMER.CUSTOMER_ID
SELECT * FROM MEMBERSHIP_CARD where CARD_ID = 'C099891'
SELECT * FROM INVOICE
JOIN ORDER_ O ON O.ORDER_ID = INVOICE.ORDER_ID AND O.BRANCH_ID = 'B003'
SELECT * FROM DISH WHERE DISH_ID = 'D015'
select * from ORDER_DISH WHERE ORDER_ID = 'O012016'
select * from DELIVERY_ORDER
SELECT * FROM INVOICE
select * from ACCOUNT A
select * from RESTAURANT_BRANCH
select * from invoice WHERE YEAR(ISSUE_DATE) = '1997'
SELECT * FROM EMPLOYEE
SELECT * FROM BRANCH_RATING JOIN OFFLINE_ORDER OFO ON OFO.BRANCH_ID = BRANCH_RATING.BRANCH_ID AND OFO.EMPLOYEE_ID = 'E014327' AND YEAR(BRANCH_RATING.RATING_DATE) = 2022
SELECT * FROM OFFLINE_ORDER OFO JOIN ORDER_ O ON O.ORDER_ID = OFO.OFORDER_ID AND YEAR(O.ORDER_DATE) = '2024' ORDER BY OFO.EMPLOYEE_ID
SELECT * FROM ONLINE_ORDER
SELECT * FROM DELIVERY_ORDER
SELECT * FROM OFFLINE_ORDER
SELECT * FROM ORDER_ O
SELECT * FROM TABLE_ WHERE BRANCH_ID = 'B012' AND TABLE_STATUS = N'Còn trống'
SELECT * FROM EMPLOYEE WHERE FULL_NAME = N'Bác Hưng Lêê'
SELECT * FROM ORDER_DISH
SELECT * FROM DEPARTMENT
select * from DISH
SELECT * FROM WORK_HISTORY WHERE EMPLOYEE_ID = 'E000002'
SELECT * FROM EMPLOYEE WHERE EMPLOYEE_ID ='E000003'
SELECT * FROM ONLINE_ACCESS_HISTORY WHERE CUSTOMER_ID = '100001C'
select * from OFFLINE_ORDER OO JOIN ORDER_ O ON O.ORDER_ID = OO.OFORDER_ID AND EMPLOYEE_ID = 'E015020'
SELECT * FROM ACCOUNT
SELECT E.EMPLOYEE_ID, E.FULL_NAME,  AVG(CAST(OFO.EMPLYEE_RATING AS FLOAT)) AS AVERAGE_RATE 
	FROM EMPLOYEE E
	JOIN OFFLINE_ORDER OFO ON OFO.EMPLOYEE_ID = E.EMPLOYEE_ID
	JOIN ORDER_ O ON O.ORDER_ID = OFO.OFORDER_ID AND YEAR(O.ORDER_DATE) = 2024
	JOIN DEPARTMENT D ON D.DEPARTMENT_ID = E.DEPARTMENT_ID AND D.BRANCH_ID = 'B012'
	WHERE E.EMPLOYEE_ID = 'E000012'
	GROUP BY E.EMPLOYEE_ID, E.FULL_NAME


	SELECT DISTINCT
              D.DEPARTMENT_ID,
              D.DEPARTMENT_NAME,
              E.SALARY
            FROM DEPARTMENT D
            JOIN RESTAURANT_BRANCH RB ON RB.BRANCH_ID = D.BRANCH_ID
            JOIN EMPLOYEE E ON E.DEPARTMENT_ID = D.DEPARTMENT_ID
            WHERE RB.BRANCH_ID = 'B001'
            GROUP BY D.DEPARTMENT_ID, D.DEPARTMENT_NAME,E.SALARY
select * from customer